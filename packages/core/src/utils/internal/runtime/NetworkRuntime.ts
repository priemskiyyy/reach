import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import type { RuntimeHooks } from "src/types/internal/RuntimeHooks";
import type { RuntimeOwnership } from "src/types/internal/RuntimeOwnership";
import type {
  RefreshFlight,
  RuntimeSession,
} from "src/types/internal/RuntimeSession";
import type { SourceIntake } from "src/types/internal/SourceIntake";
import type { NetworkAdapter } from "src/types/NetworkAdapter";
import type { NetworkAdapterContext } from "src/types/NetworkAdapterContext";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import type { NetworkObservation } from "src/types/NetworkObservation";
import type { NetworkSession } from "src/types/NetworkSession";
import type { NetworkState } from "src/types/NetworkState";
import type { OperationOptions } from "src/types/OperationOptions";
import type { ReachClock } from "src/types/ReachClock";
import type { RefreshRequest } from "src/types/RefreshRequest";
import type { RefreshResult } from "src/types/RefreshResult";
import type { RuntimeLease } from "src/types/RuntimeLease";
import type { RuntimeStatus } from "src/types/RuntimeStatus";
import { UNKNOWN_NETWORK_STATE } from "src/utils/constants/network";
import {
  DISPOSED_STATUS,
  IDLE_STATUS,
  REFRESHING_STATUS,
  RUNNING_STATUS,
  STARTING_STATUS,
} from "src/utils/constants/status";
import { assertUnreachable } from "src/utils/internal/common/assertUnreachable";
import { createDeferred } from "src/utils/internal/common/createDeferred";
import { waitWithSignal } from "src/utils/internal/common/waitWithSignal";
import { createAbortedError } from "src/utils/internal/errors/createAbortedError";
import { createDisposedError } from "src/utils/internal/errors/createDisposedError";
import { createNotStartedError } from "src/utils/internal/errors/createNotStartedError";
import { getFailedFacts } from "src/utils/internal/evidence/getFailedFacts";
import { getStaleFacts } from "src/utils/internal/evidence/getStaleFacts";
import { isRouteChange } from "src/utils/internal/evidence/isRouteChange";
import { isSameFacts } from "src/utils/internal/evidence/isSameFacts";
import { readObservation } from "src/utils/internal/evidence/readObservation";
import type { Listeners } from "src/utils/internal/observable/Listeners";
import { Transaction } from "src/utils/internal/observable/Transaction";
import { ValueStore } from "src/utils/internal/observable/ValueStore";
import { ResourceScope } from "src/utils/internal/runtime/ResourceScope";
import { ReachError } from "src/utils/ReachError";

type Waiter = { resolve: () => void; reject: (error: unknown) => void };

type Lease = { waiter: Waiter; released: boolean };

type NetworkRuntimeOptions<TNative> = {
  adapter: NetworkAdapter<TNative>;
  clock: ReachClock;
  timeouts: { open: number; refresh: number };
  hooks: RuntimeHooks;
  createListeners: () => Listeners;
};

const IDLE: RuntimeOwnership<never> = Object.freeze({ state: "IDLE" });

const DISPOSED: RuntimeOwnership<never> = Object.freeze({ state: "DISPOSED" });

const getErrorStatus = (error: ReachError): RuntimeStatus =>
  Object.freeze({
    state: "error",
    error: Object.freeze({ code: error.code, message: error.message }),
  });

// Owns the one source: its leases, sessions, the order of its reports, its
// refreshes and the network state they publish.
export class NetworkRuntime<TNative> {
  #adapter: NetworkAdapter<TNative>;
  #clock: ReachClock;
  #timeouts: { open: number; refresh: number };
  #hooks: RuntimeHooks;
  #ownership: RuntimeOwnership<TNative> = IDLE;
  #leases = new Set<Lease>();
  #waiters = new Set<Waiter>();
  #sessions = 0;

  state: ValueStore<NetworkState>;
  status: ValueStore<RuntimeStatus>;
  capabilities: ValueStore<NetworkCapabilities | null>;
  native: ValueStore<TNative | null>;

  constructor({
    adapter,
    clock,
    timeouts,
    hooks,
    createListeners,
  }: NetworkRuntimeOptions<TNative>) {
    this.#adapter = adapter;
    this.#clock = clock;
    this.#timeouts = timeouts;
    this.#hooks = hooks;
    this.state = new ValueStore(UNKNOWN_NETWORK_STATE, createListeners());
    this.status = new ValueStore(IDLE_STATUS, createListeners());
    this.capabilities = new ValueStore<NetworkCapabilities | null>(
      null,
      createListeners(),
    );
    this.native = new ValueStore<TNative | null>(null, createListeners());
  }

  leaseCount = () => this.#leases.size;

  isRunning = () => this.#ownership.state === "RUNNING";

  isDisposed = () => this.#ownership.state === "DISPOSED";

  sessionId = () => {
    const ownership = this.#ownership;

    if (ownership.state === "STARTING") {
      return ownership.session.id;
    }

    if (ownership.state === "RUNNING") {
      return ownership.session.id;
    }

    return null;
  };

  start = (): RuntimeLease => {
    const ownership = this.#ownership;

    if (ownership.state === "DISPOSED") {
      throw createDisposedError();
    }

    const ready = createDeferred();

    const lease: Lease = {
      waiter: { resolve: ready.resolve, reject: ready.reject },
      released: false,
    };

    const handle: RuntimeLease = Object.freeze({
      ready: ready.promise,
      release: () => this.#release(lease),
    });

    this.#leases.add(lease);
    this.#hooks.record("lease-acquired");

    if (ownership.state === "RUNNING") {
      ready.resolve();

      return handle;
    }

    this.#waiters.add(lease.waiter);

    if (ownership.state === "STARTING") {
      return handle;
    }

    this.#open();

    return handle;
  };

  /** Waits for an opening that is already under way, without starting one. */
  whenRunning = (signal?: AbortSignal): Promise<void> => {
    const ownership = this.#ownership;

    if (ownership.state === "DISPOSED") {
      return Promise.reject(createDisposedError());
    }

    if (signal?.aborted === true) {
      return Promise.reject(createAbortedError());
    }

    if (ownership.state === "RUNNING") {
      return Promise.resolve();
    }

    if (ownership.state === "FAILED") {
      return Promise.reject(ownership.error);
    }

    if (ownership.state === "IDLE") {
      return Promise.reject(createNotStartedError());
    }

    const opened = createDeferred();
    const waiter: Waiter = { resolve: opened.resolve, reject: opened.reject };

    this.#waiters.add(waiter);

    return waitWithSignal(opened.promise, signal, () => {
      this.#waiters.delete(waiter);
    });
  };

  refresh = ({ signal }: OperationOptions = {}): Promise<RefreshResult> => {
    // An explicit refresh with remaining owners is the one way to retry a failed opening.
    if (this.#ownership.state === "FAILED") {
      this.#open();
    }

    const ownership = this.#ownership;

    // A running source is read at once, so a caller sees the refresh begin.
    if (ownership.state === "RUNNING" && signal?.aborted !== true) {
      return this.#joinRefresh(ownership, signal);
    }

    return this.whenRunning(signal).then(() => {
      const current = this.#ownership;

      if (current.state !== "RUNNING") {
        throw createNotStartedError();
      }

      return this.#joinRefresh(current, signal);
    });
  };

  /** Starts a new network generation without a source report, such as on a return to the foreground. */
  advanceGeneration = () => {
    if (!this.isRunning()) {
      return;
    }

    const state = this.state.get();
    const transaction = new Transaction();

    this.#install(transaction, state, state.generation + 1);
    transaction.commit();
  };

  dispose = () => {
    const ownership = this.#ownership;

    if (ownership.state === "DISPOSED") {
      return;
    }

    this.#ownership = DISPOSED;

    const error = createDisposedError();

    this.#leases.clear();
    this.#rejectWaiters(error);

    const transaction = new Transaction();

    if (ownership.state === "STARTING") {
      this.#endSession(ownership.session, error);
    }

    if (ownership.state === "RUNNING") {
      this.#endSession(ownership.session, error);

      const state = this.state.get();

      this.#install(
        transaction,
        getStaleFacts(state, "runtime-disposed"),
        state.generation + 1,
      );
    }

    transaction.set(this.status, DISPOSED_STATUS);
    transaction.set(this.capabilities, null);
    transaction.set(this.native, null);
    this.#hooks.onStop(transaction, error);
    transaction.commit();
    this.#hooks.record("disposed");
    this.state.close();
    this.status.close();
    this.capabilities.close();
    this.native.close();
  };

  #joinRefresh(
    {
      session,
      source,
    }: Extract<RuntimeOwnership<TNative>, { state: "RUNNING" }>,
    signal: AbortSignal | undefined,
  ): Promise<RefreshResult> {
    if (source.refresh === undefined) {
      return Promise.resolve(
        Object.freeze({ status: "unsupported", state: this.state.get() }),
      );
    }

    const flight =
      session.refresh ?? this.#startRefresh(session, source.refresh);

    return waitWithSignal(flight.promise, signal);
  }

  #isLive(session: RuntimeSession) {
    const ownership = this.#ownership;

    if (ownership.state === "STARTING") {
      return ownership.session === session;
    }

    if (ownership.state === "RUNNING") {
      return ownership.session === session;
    }

    return false;
  }

  #isOpening(session: RuntimeSession) {
    const ownership = this.#ownership;

    if (ownership.state !== "STARTING") {
      return false;
    }

    return ownership.session === session;
  }

  #release(lease: Lease) {
    if (lease.released) {
      return;
    }

    lease.released = true;

    if (this.isDisposed()) {
      return;
    }

    this.#leases.delete(lease);
    this.#waiters.delete(lease.waiter);
    lease.waiter.reject(
      new ReachError({
        code: "RELEASED",
        message: "The lease was released before its source was ready.",
      }),
    );
    this.#hooks.record("lease-released");

    if (this.#leases.size > 0) {
      return;
    }

    this.#stop();
  }

  #stop() {
    const ownership = this.#ownership;

    if (ownership.state === "IDLE") {
      return;
    }

    if (ownership.state === "DISPOSED") {
      return;
    }

    this.#ownership = IDLE;
    this.#rejectWaiters(createNotStartedError());

    if (ownership.state === "FAILED") {
      this.status.update(IDLE_STATUS);

      return;
    }

    const stopped = new ReachError({
      code: "SUPERSEDED",
      message: "The runtime stopped before this settled.",
    });

    this.#endSession(ownership.session, stopped);

    const transaction = new Transaction();

    if (ownership.state === "RUNNING") {
      const state = this.state.get();

      this.#install(
        transaction,
        getStaleFacts(state, "runtime-idle"),
        state.generation + 1,
      );
    }

    transaction.set(this.status, IDLE_STATUS);
    transaction.set(this.capabilities, null);
    transaction.set(this.native, null);
    this.#hooks.onStop(transaction, stopped);
    transaction.commit();
    this.#hooks.record("session-stopped");
  }

  #open() {
    this.#sessions += 1;

    const session: RuntimeSession = {
      id: this.#sessions,
      scope: new ResourceScope(this.#hooks.reportCleanupError),
      controller: new AbortController(),
      reserved: 0,
      committed: 0,
      routeKey: null,
      pending: null,
      cancelOpening: () => {},
      refresh: null,
    };

    this.#ownership = { state: "STARTING", session };
    session.cancelOpening = this.#clock.setTimer(() => {
      this.#fail(
        session,
        new ReachError({
          code: "SOURCE_TIMEOUT",
          message: `The ${this.#adapter.name} adapter did not open within ${this.#timeouts.open} milliseconds.`,
        }),
      );
    }, this.#timeouts.open);

    this.status.update(STARTING_STATUS);
    this.#hooks.record("session-opening");

    // A status listener may have released or disposed the runtime already.
    if (!this.#isOpening(session)) {
      return;
    }

    let opened: NetworkSession<TNative> | Promise<NetworkSession<TNative>>;

    try {
      opened = this.#adapter.open(this.#createContext(session));
    } catch (error) {
      this.#fail(session, this.#createSourceError("open", error));

      return;
    }

    if (opened instanceof Promise) {
      opened.then(
        (source) => this.#adopt(session, source),
        (error: unknown) =>
          this.#fail(session, this.#createSourceError("open", error)),
      );

      return;
    }

    this.#adopt(session, opened);
  }

  #adopt(session: RuntimeSession, source: NetworkSession<TNative>) {
    // A late session's scope already ended, so every cleanup it registered has run.
    if (!this.#isOpening(session)) {
      this.#hooks.record("late-callback", { reason: "session" });

      return;
    }

    session.cancelOpening();
    this.#ownership = { state: "RUNNING", session, source };

    const { pending } = session;

    session.pending = null;

    if (pending !== null) {
      session.committed = pending.sequence;
    }

    const state = this.state.get();
    const transaction = new Transaction();

    // Adoption starts one generation, however many reports arrived while it opened.
    this.#install(
      transaction,
      this.#getAdoptedFacts(pending),
      state.generation + 1,
    );
    transaction.set(this.capabilities, source.capabilities);
    transaction.set(this.native, source.native);
    transaction.set(this.status, RUNNING_STATUS);
    transaction.commit();
    this.#hooks.record("session-opened");
    this.#resolveWaiters();
    this.#hooks.onAdopt();
  }

  #getAdoptedFacts(pending: SourceIntake | null): NetworkFacts {
    if (pending === null) {
      return UNKNOWN_NETWORK_STATE;
    }

    if (pending.kind === "observation") {
      return pending.facts;
    }

    if (pending.kind === "error") {
      return getFailedFacts(UNKNOWN_NETWORK_STATE, pending.reason);
    }

    if (pending.kind === "gap") {
      return UNKNOWN_NETWORK_STATE;
    }

    return assertUnreachable(pending);
  }

  #fail(session: RuntimeSession, error: ReachError) {
    if (!this.#isOpening(session)) {
      return;
    }

    this.#ownership = { state: "FAILED", error };
    this.#endSession(session, error);
    this.#rejectWaiters(error);
    this.status.update(getErrorStatus(error));
    this.#hooks.record("session-failed", { reason: error.code });
  }

  #endSession(session: RuntimeSession, error: ReachError) {
    session.cancelOpening();
    session.controller.abort();
    session.scope.dispose();

    const { refresh } = session;

    session.refresh = null;

    if (refresh !== null) {
      refresh.reject(error);
    }
  }

  #resolveWaiters() {
    const waiters = [...this.#waiters];

    this.#waiters.clear();

    for (const waiter of waiters) {
      waiter.resolve();
    }
  }

  #rejectWaiters(error: ReachError) {
    const waiters = [...this.#waiters];

    this.#waiters.clear();

    for (const waiter of waiters) {
      waiter.reject(error);
    }
  }

  #createSourceError(operation: "open" | "refresh", cause: unknown) {
    return new ReachError({
      code: "SOURCE_ERROR",
      message: `The ${this.#adapter.name} adapter failed to ${operation}.`,
      cause,
    });
  }

  #createContext(session: RuntimeSession): NetworkAdapterContext {
    return Object.freeze({
      signal: session.controller.signal,
      emit: (observation: NetworkObservation) => {
        this.#intakeObservation(session, this.#reserve(session), observation);
      },
      reserve: () => {
        const sequence = this.#reserve(session);

        return Object.freeze({
          emit: (observation: NetworkObservation) => {
            this.#intakeObservation(session, sequence, observation);
          },
          reportError: () => {
            this.#intake(session, {
              kind: "error",
              sequence,
              reason: "source-error",
            });
          },
        });
      },
      invalidate: (reason: "observation-gap" | "source-reset") => {
        this.#intake(session, {
          kind: "gap",
          sequence: this.#reserve(session),
          reason,
        });
      },
      reportError: () => {
        this.#intake(session, {
          kind: "error",
          sequence: this.#reserve(session),
          reason: "source-error",
        });
      },
      onDispose: session.scope.add,
    });
  }

  #reserve(session: RuntimeSession) {
    session.reserved += 1;

    return session.reserved;
  }

  #intakeObservation(
    session: RuntimeSession,
    sequence: number,
    observation: NetworkObservation,
  ) {
    let facts: NetworkFacts;

    // A report that breaks its type is a source failure, never an offline device.
    try {
      facts = readObservation(observation, this.#clock.now());
    } catch {
      return this.#intake(session, {
        kind: "error",
        sequence,
        reason: "malformed-observation",
      });
    }

    return this.#intake(session, {
      kind: "observation",
      sequence,
      facts,
      route: observation.route,
    });
  }

  /** Answers whether the report was accepted; an obsolete or late one is not. */
  #intake(session: RuntimeSession, intake: SourceIntake) {
    if (!this.#isLive(session)) {
      this.#hooks.record("late-callback");

      return false;
    }

    if (intake.sequence <= session.committed) {
      this.#hooks.record("observation-discarded", { reason: "obsolete" });

      return false;
    }

    if (this.#isOpening(session)) {
      return this.#buffer(session, intake);
    }

    session.committed = intake.sequence;
    this.#apply(session, intake);

    return true;
  }

  // Reports during opening wait for adoption; only the newest can matter, as each replaces the whole state.
  #buffer(session: RuntimeSession, intake: SourceIntake) {
    const { pending } = session;

    if (pending !== null && pending.sequence > intake.sequence) {
      this.#hooks.record("observation-discarded", { reason: "obsolete" });

      return false;
    }

    session.pending = intake;

    return true;
  }

  #apply(session: RuntimeSession, intake: SourceIntake) {
    const state = this.state.get();

    if (intake.kind === "gap") {
      this.#publish(getStaleFacts(state, intake.reason), state.generation + 1);
      this.#hooks.record("source-invalidated", { reason: intake.reason });

      return;
    }

    if (intake.kind === "error") {
      this.#applyError(state, intake.reason);

      return;
    }

    if (intake.kind === "observation") {
      this.#applyObservation(session, state, intake);

      return;
    }

    assertUnreachable(intake);
  }

  #applyError(state: NetworkState, reason: string) {
    const facts = getFailedFacts(state, reason);

    this.#hooks.record("source-error", { reason });

    if (isSameFacts(state, facts)) {
      return;
    }

    this.#publish(facts, state.generation + 1);
  }

  #applyObservation(
    session: RuntimeSession,
    state: NetworkState,
    { facts, route }: Extract<SourceIntake, { kind: "observation" }>,
  ) {
    const previousKey = session.routeKey;
    const routeChanged = isRouteChange(state, facts, route, previousKey);

    if (route?.key !== undefined) {
      session.routeKey = route.key;
    }

    if (!routeChanged && isSameFacts(state, facts)) {
      this.#hooks.record("observation-duplicate");

      return;
    }

    this.#publish(
      facts,
      routeChanged ? state.generation + 1 : state.generation,
    );
    this.#hooks.record("observation-accepted");

    if (routeChanged) {
      this.#hooks.onNetworkChange();
    }
  }

  #publish(facts: NetworkFacts, generation: number) {
    const transaction = new Transaction();

    this.#install(transaction, facts, generation);
    transaction.commit();
  }

  #install(transaction: Transaction, facts: NetworkFacts, generation: number) {
    const previous = this.state.get();

    transaction.set(
      this.state,
      Object.freeze({
        revision: previous.revision + 1,
        generation,
        connection: facts.connection,
        internet: facts.internet,
        cost: facts.cost,
        preferences: facts.preferences,
        evidence: facts.evidence,
      }),
    );

    if (generation === previous.generation) {
      return;
    }

    this.#hooks.onGeneration(transaction);
  }

  #startRefresh(
    session: RuntimeSession,
    refresh: (request: RefreshRequest) => void | Promise<void>,
  ): RefreshFlight {
    const result = createDeferred<RefreshResult>();

    const flight: RefreshFlight = {
      promise: result.promise,
      reject: result.reject,
    };

    const controller = new AbortController();
    const sequence = this.#reserve(session);
    const { revision } = this.state.get();

    let superseded = false;

    const settle = () => {
      if (session.refresh !== flight) {
        return false;
      }

      session.refresh = null;
      cancelDeadline();
      this.status.update(RUNNING_STATUS);
      this.#hooks.record("refresh-settled");

      return true;
    };

    const fail = (error: ReachError, reason: string) => {
      controller.abort();

      if (!settle()) {
        return;
      }

      this.#intake(session, { kind: "error", sequence, reason });
      result.reject(error);
    };

    const complete = () => {
      if (!settle()) {
        return;
      }

      const state = this.state.get();

      if (superseded) {
        result.resolve(Object.freeze({ status: "superseded", state }));

        return;
      }

      result.resolve(
        Object.freeze({
          status: state.revision === revision ? "unchanged" : "updated",
          state,
        }),
      );
    };

    const emit = (observation: NetworkObservation) => {
      if (this.#intakeObservation(session, sequence, observation)) {
        return;
      }

      superseded = true;
    };

    const cancelDeadline = this.#clock.setTimer(() => {
      fail(
        new ReachError({
          code: "SOURCE_TIMEOUT",
          message: `The ${this.#adapter.name} adapter did not refresh within ${this.#timeouts.refresh} milliseconds.`,
        }),
        "source-timeout",
      );
    }, this.#timeouts.refresh);

    session.refresh = flight;
    this.status.update(REFRESHING_STATUS);
    this.#hooks.record("refresh-started");

    // A status listener may have ended the session, which rejected this flight.
    if (!this.#isLive(session)) {
      return flight;
    }

    const handleFailure = (error: unknown) => {
      fail(this.#createSourceError("refresh", error), "source-error");
    };

    try {
      const refreshed = refresh({ signal: controller.signal, emit });

      if (refreshed instanceof Promise) {
        refreshed.then(complete, handleFailure);

        return flight;
      }

      complete();
    } catch (error) {
      handleFailure(error);
    }

    return flight;
  }
}
