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
import { UNAVAILABLE_CAPABILITIES } from "src/utils/constants/capabilities";
import {
  UNAVAILABLE_EVIDENCE,
  UNKNOWN_NETWORK_STATE,
} from "src/utils/constants/network";
import {
  DISPOSED_STATUS,
  IDLE_STATUS,
  REFRESHING_STATUS,
  RUNNING_STATUS,
  STARTING_STATUS,
} from "src/utils/constants/status";
import { assertUnreachable } from "src/utils/internal/common/assertUnreachable";
import { createDeferred } from "src/utils/internal/common/createDeferred";
import { isPromiseLike } from "src/utils/internal/common/isPromiseLike";
import { waitWithSignal } from "src/utils/internal/common/waitWithSignal";
import { createAbortedError } from "src/utils/internal/errors/createAbortedError";
import { createDisposedError } from "src/utils/internal/errors/createDisposedError";
import { createNotStartedError } from "src/utils/internal/errors/createNotStartedError";
import { copyCapabilities } from "src/utils/internal/evidence/copyCapabilities";
import { getFailedFacts } from "src/utils/internal/evidence/getFailedFacts";
import { getStaleFacts } from "src/utils/internal/evidence/getStaleFacts";
import { isConnectionChange } from "src/utils/internal/evidence/isConnectionChange";
import { isSameFacts } from "src/utils/internal/evidence/isSameFacts";
import { mapEvidence } from "src/utils/internal/evidence/mapEvidence";
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

type RunningSource<TNative> = {
  facts: NetworkFacts;
  capabilities: NetworkCapabilities;
  native: TNative | null;
  refresh: Extract<RuntimeOwnership, { state: "RUNNING" }>["refresh"];
};

const IDLE: RuntimeOwnership = Object.freeze({ state: "IDLE" });

const DISPOSED: RuntimeOwnership = Object.freeze({ state: "DISPOSED" });

const UNAVAILABLE_FACTS = mapEvidence(
  UNKNOWN_NETWORK_STATE,
  () => UNAVAILABLE_EVIDENCE,
);

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
  #ownership: RuntimeOwnership = IDLE;
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

  sessionId = () => this.#sessionOf(this.#ownership)?.id ?? null;

  start = (): RuntimeLease => {
    if (this.#ownership.state === "DISPOSED") {
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

    // A diagnostics listener may have started, released or disposed meanwhile.
    this.#admit(lease);

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

    if (ownership.state === "STARTING") {
      const opened = createDeferred();
      const waiter: Waiter = { resolve: opened.resolve, reject: opened.reject };

      this.#waiters.add(waiter);

      return waitWithSignal(opened.promise, signal, () => {
        this.#waiters.delete(waiter);
      });
    }

    return assertUnreachable(ownership);
  };

  refresh = ({ signal }: OperationOptions = {}): Promise<RefreshResult> => {
    // Like start, an explicit refresh retries a failed opening for the owners it still has.
    if (this.#ownership.state === "FAILED" && signal?.aborted !== true) {
      this.#open();
    }

    const ownership = this.#ownership;

    // A running source is read at once, so a caller sees the refresh begin.
    if (ownership.state === "RUNNING" && signal?.aborted !== true) {
      return this.#joinRefresh(ownership, signal);
    }

    return this.whenRunning(signal).then(() => {
      const current = this.#ownership;

      // A caller who gave up while the source opened starts no read.
      if (signal?.aborted === true) {
        throw createAbortedError();
      }

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
    this.#publishStopped(ownership, error, "runtime-disposed", DISPOSED_STATUS);
    this.#hooks.record("disposed");

    const session = this.#sessionOf(ownership);

    if (session !== null) {
      this.#endSession(session, error);
    }

    this.state.close();
    this.status.close();
    this.capabilities.close();
    this.native.close();
  };

  #joinRefresh(
    { session, refresh }: Extract<RuntimeOwnership, { state: "RUNNING" }>,
    signal: AbortSignal | undefined,
  ): Promise<RefreshResult> {
    if (refresh === null) {
      return Promise.resolve(
        Object.freeze({ status: "unsupported", state: this.state.get() }),
      );
    }

    const flight = session.refresh ?? this.#startRefresh(session, refresh);

    return waitWithSignal(flight.promise, signal);
  }

  #sessionOf(ownership: RuntimeOwnership) {
    if (ownership.state === "STARTING") {
      return ownership.session;
    }

    if (ownership.state === "RUNNING") {
      return ownership.session;
    }

    return null;
  }

  #isLive(session: RuntimeSession) {
    return this.#sessionOf(this.#ownership) === session;
  }

  // Puts a new lease to work on the runtime as it is now.
  #admit(lease: Lease) {
    const ownership = this.#ownership;

    if (lease.released) {
      return;
    }

    if (ownership.state === "DISPOSED") {
      lease.waiter.reject(createDisposedError());

      return;
    }

    if (ownership.state === "RUNNING") {
      lease.waiter.resolve();

      return;
    }

    this.#waiters.add(lease.waiter);

    if (ownership.state === "STARTING") {
      return;
    }

    if (ownership.state === "IDLE") {
      this.#open();

      return;
    }

    if (ownership.state === "FAILED") {
      this.#open();

      return;
    }

    assertUnreachable(ownership);
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

    // Published before the session's cleanups run, so a cleanup that calls back finds the runtime stopped.
    this.#publishStopped(ownership, stopped, "runtime-idle", IDLE_STATUS);
    this.#hooks.record("session-stopped");
    this.#endSession(ownership.session, stopped);
  }

  // One transaction for a source that stopped: checks learn why they end
  // before the stale state starts a new generation, and nothing reads as open.
  // The status is installed first, so a callback of the stop that starts or
  // disposes the runtime installs its own over it.
  #publishStopped(
    ownership: RuntimeOwnership,
    error: ReachError,
    reason: string,
    status: RuntimeStatus,
  ) {
    const transaction = new Transaction();

    transaction.set(this.status, status);
    transaction.set(this.capabilities, null);
    transaction.set(this.native, null);
    this.#hooks.onStop(transaction, error);

    // A callback that already runs a new session has installed that session's facts.
    if (ownership.state === "RUNNING" && !this.isRunning()) {
      const state = this.state.get();

      this.#install(
        transaction,
        getStaleFacts(state, reason),
        state.generation + 1,
      );
    }

    transaction.commit();
  }

  #open() {
    this.#sessions += 1;

    const session: RuntimeSession = {
      id: this.#sessions,
      scope: new ResourceScope(this.#hooks.reportCleanupError),
      reserved: 0,
      committed: 0,
      pending: null,
      cancelOpening: () => {},
      refresh: null,
    };

    // The session opens from here, so a probe that calls back joins it instead of opening another.
    this.#ownership = { state: "STARTING", session };

    let available: boolean;

    try {
      available = this.#adapter.available();
    } catch (error) {
      // A probe that throws fails this opening, as a throwing open would.
      this.#fail(session, this.#createSourceError("open", error));

      return;
    }

    // A probe that called back may have released or disposed the runtime.
    if (!this.#isOpening(session)) {
      return;
    }

    // A host without the source, such as a server render, runs with every fact unsupported instead of failing.
    if (!available) {
      this.#run(
        session,
        {
          facts: UNAVAILABLE_FACTS,
          capabilities: UNAVAILABLE_CAPABILITIES,
          native: null,
          refresh: null,
        },
        "source-unavailable",
      );

      return;
    }

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

    if (isPromiseLike(opened)) {
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

    let capabilities: NetworkCapabilities;

    // The types rule out a malformed session; an untyped adapter that sends one still fails instead of hanging.
    try {
      capabilities = copyCapabilities(source.capabilities);
    } catch (error) {
      this.#fail(session, this.#createSourceError("open", error));

      return;
    }

    session.cancelOpening();

    const { pending } = session;

    session.pending = null;

    if (pending !== null) {
      session.committed = pending.sequence;
    }

    this.#run(
      session,
      {
        facts: this.#getAdoptedFacts(pending),
        capabilities,
        native: source.native,
        refresh: source.refresh ?? null,
      },
      "session-opened",
    );
  }

  #run(
    session: RuntimeSession,
    { facts, capabilities, native, refresh }: RunningSource<TNative>,
    event: "session-opened" | "source-unavailable",
  ) {
    this.#ownership = { state: "RUNNING", session, refresh };

    const transaction = new Transaction();

    // Running starts one generation, however many reports arrived while the session opened.
    this.#install(transaction, facts, this.state.get().generation + 1);
    transaction.set(this.capabilities, capabilities);
    transaction.set(this.native, native);
    transaction.set(this.status, RUNNING_STATUS);
    transaction.commit();

    // A listener may have stopped, restarted or disposed the runtime; this session is then over.
    if (!this.#isLive(session)) {
      return;
    }

    this.#hooks.record(event);

    if (!this.#isLive(session)) {
      return;
    }

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
      this.#hooks.record("late-callback", { reason: "session" });

      return;
    }

    const failed: RuntimeOwnership = { state: "FAILED", error };

    this.#ownership = failed;
    this.#endSession(session, error);

    // A cleanup that called back may have started or disposed the runtime meanwhile.
    if (this.#ownership !== failed) {
      return;
    }

    this.#rejectWaiters(error);
    this.status.update(getErrorStatus(error));
    this.#hooks.record("session-failed", { reason: error.code });
  }

  #endSession(session: RuntimeSession, error: ReachError) {
    session.cancelOpening();
    session.scope.dispose();

    const { refresh } = session;

    session.refresh = null;

    if (refresh !== null) {
      refresh.cancel(error);
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
      invalidate: () => {
        this.#intake(session, {
          kind: "gap",
          sequence: this.#reserve(session),
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
    return this.#intake(session, {
      kind: "observation",
      sequence,
      facts: readObservation(observation, this.#clock.now()),
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

    if (pending !== null && pending.sequence >= intake.sequence) {
      this.#hooks.record("observation-discarded", { reason: "obsolete" });

      return false;
    }

    session.pending = intake;

    return true;
  }

  #apply(session: RuntimeSession, intake: SourceIntake) {
    const state = this.state.get();

    if (intake.kind === "gap") {
      this.#publish(
        getStaleFacts(state, "observation-gap"),
        state.generation + 1,
      );
      this.#hooks.record("source-invalidated");

      return;
    }

    if (intake.kind === "error") {
      this.#applyError(state, intake.reason);

      return;
    }

    if (intake.kind === "observation") {
      this.#applyObservation(session, state, intake.facts);

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
    facts: NetworkFacts,
  ) {
    if (isSameFacts(state, facts)) {
      this.#hooks.record("observation-duplicate");

      return;
    }

    const changed = isConnectionChange(state, facts);

    this.#publish(facts, changed ? state.generation + 1 : state.generation);

    // A state listener may have ended this session; a change it never saw through triggers nothing.
    if (!this.#isLive(session)) {
      return;
    }

    this.#hooks.record("observation-accepted");

    if (changed) {
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
    const controller = new AbortController();
    const sequence = this.#reserve(session);

    const flight: RefreshFlight = {
      promise: result.promise,
      cancel: (error) => {
        controller.abort();
        cancelDeadline();
        result.reject(error);
      },
    };

    // What became of the refresh's own report: nothing yet, accepted with or without a change, or discarded as older.
    let outcome: "none" | "unchanged" | "updated" | "superseded" = "none";

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

      if (session.refresh !== flight) {
        return;
      }

      // The failure is installed before the refresh ends, so no listener reads it as over without its result.
      this.#intake(session, { kind: "error", sequence, reason });
      settle();
      result.reject(error);
    };

    // A refresh that reported nothing was overtaken if a newer report was accepted meanwhile.
    const readStatus = (): RefreshResult["status"] => {
      if (outcome !== "none") {
        return outcome;
      }

      return session.committed > sequence ? "superseded" : "unchanged";
    };

    const complete = () => {
      if (!settle()) {
        return;
      }

      result.resolve(
        Object.freeze({ status: readStatus(), state: this.state.get() }),
      );
    };

    const emit = (observation: NetworkObservation) => {
      const { revision } = this.state.get();

      if (!this.#intakeObservation(session, sequence, observation)) {
        outcome = "superseded";

        return;
      }

      outcome =
        this.state.get().revision === revision ? "unchanged" : "updated";
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

      if (isPromiseLike(refreshed)) {
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
