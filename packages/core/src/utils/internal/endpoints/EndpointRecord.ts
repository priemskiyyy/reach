import type { CheckResult } from "src/types/CheckResult";
import type { Condition } from "src/types/Condition";
import type { EndpointAttempt } from "src/types/EndpointAttempt";
import type { EndpointState } from "src/types/EndpointState";
import type { EndpointEnvironment } from "src/types/internal/EndpointEnvironment";
import type { EndpointRecordState } from "src/types/internal/EndpointRecordState";
import type { CheckWaiter, ProbeFlight } from "src/types/internal/ProbeFlight";
import type { ResolvedEndpoint } from "src/types/internal/ResolvedEndpoint";
import type { ScopeReading } from "src/types/internal/ScopeReading";
import type { ObservableValue } from "src/types/ObservableValue";
import type { ProbeContext } from "src/types/ProbeContext";
import type { ProbeResult } from "src/types/ProbeResult";
import { EMPTY_RECORD_STATE } from "src/utils/constants/endpoints";
import { createDeferred } from "src/utils/internal/common/createDeferred";
import { isPromiseLike } from "src/utils/internal/common/isPromiseLike";
import { waitWithSignal } from "src/utils/internal/common/waitWithSignal";
import { deriveCondition } from "src/utils/internal/conditions/deriveCondition";
import { evaluateAvailability } from "src/utils/internal/conditions/evaluateAvailability";
import { isExpired } from "src/utils/internal/endpoints/isExpired";
import { isSameEndpointState } from "src/utils/internal/endpoints/isSameEndpointState";
import { projectEndpointState } from "src/utils/internal/endpoints/projectEndpointState";
import { readScope } from "src/utils/internal/endpoints/readScope";
import { createAbortedError } from "src/utils/internal/errors/createAbortedError";
import { createNotStartedError } from "src/utils/internal/errors/createNotStartedError";
import { DerivedValue } from "src/utils/internal/observable/DerivedValue";
import type { Listeners } from "src/utils/internal/observable/Listeners";
import { Transaction } from "src/utils/internal/observable/Transaction";
import { ValueStore } from "src/utils/internal/observable/ValueStore";
import { ReachError } from "src/utils/ReachError";

type Outcome = Pick<ProbeResult, "verdict" | "response"> & {
  reason: string | null;
};

const TIMEOUT_OUTCOME: Outcome = Object.freeze({
  verdict: "fail",
  response: "unknown",
  reason: "timeout",
});

// One named endpoint: its record, its current check and the waiters on it.
// Every change of network, scope, session or owners ends the check before
// anything else commits, so an obsolete result can never become current.
export class EndpointRecord {
  #definition: ResolvedEndpoint;
  #environment: EndpointEnvironment;
  #record: ValueStore<EndpointRecordState>;
  #expiry: Listeners;
  #settlements: Listeners;
  #cancelExpiry = () => {};
  #flight: ProbeFlight | null = null;
  #lastStart: number | null = null;

  state: ObservableValue<EndpointState>;
  available: Condition;

  constructor(definition: ResolvedEndpoint, environment: EndpointEnvironment) {
    this.#definition = definition;
    this.#environment = environment;
    this.#record = new ValueStore(
      EMPTY_RECORD_STATE,
      environment.createListeners(),
    );
    this.#expiry = environment.createListeners();
    this.#settlements = environment.createListeners();

    // The record moves the diagnostic snapshot, with or without an event.
    this.#record.subscribe(environment.changed);

    const { scope } = definition;

    // Expiry is time, not a commit: a read past the deadline already answers stale.
    const expiry: ObservableValue<boolean> = {
      get: () => this.#isExpired(),
      subscribe: this.#expiry.add,
    };

    const sources: Array<ObservableValue<unknown>> = [
      this.#record.observable,
      expiry,
    ];

    if (scope !== null) {
      sources.push(scope);
    }

    this.state = new DerivedValue({
      sources,
      compute: () =>
        projectEndpointState(
          this.#record.get(),
          readScope(scope),
          this.#isExpired(),
        ),
      isEqual: isSameEndpointState,
      listeners: environment.createListeners(),
    }).observable;

    this.available = deriveCondition(
      [this.state],
      () => evaluateAvailability(definition.name, this.state.get()),
      { listeners: environment.createListeners() },
    );
  }

  scope = () => this.#definition.scope;

  isChecking = () => this.#flight !== null;

  waiterCount = () => this.#flight?.waiters.size ?? 0;

  /** When the latest check began, in monotonic milliseconds. */
  lastStart = () => this.#lastStart;

  /** Hears every check that ends, whoever started it. */
  onSettle = (listener: () => void) => this.#settlements.add(listener);

  check = (signal?: AbortSignal): Promise<CheckResult> => {
    const { network } = this.#environment;

    // A running source is checked at once, so a caller sees the check begin.
    if (network.isRunning() && signal?.aborted !== true) {
      return this.#checkNow(signal);
    }

    return network.whenRunning(signal).then(() => this.#checkNow(signal));
  };

  /**
   * Joins or starts a check on behalf of monitoring while `isWanted()` still
   * holds once the scope is reconciled, or says why it cannot.
   */
  startAutomatic = (
    isWanted: () => boolean,
  ): "started" | "joined" | "overtaken" | "scope-unavailable" | "capacity" => {
    const reading = this.#reconcileForCheck();

    // Listeners of a new key stopped the runtime, changed the key again or ended the demand.
    if (reading === "stopped" || reading === "moved" || !isWanted()) {
      return "overtaken";
    }

    // A new key's listeners may start a check of their own, which this joins.
    const flight = this.#flight;

    if (flight !== null) {
      flight.monitored = true;

      return "joined";
    }

    if (reading.scope === "unavailable") {
      return "scope-unavailable";
    }

    const { capacity } = this.#environment;

    if (capacity.outstanding >= capacity.max) {
      return "capacity";
    }

    this.#start(reading.key, null);

    return "started";
  };

  /** Leaves the current check to its manual waiters, and ends it when there are none. */
  releaseAutomatic = () => {
    const flight = this.#flight;

    if (flight === null) {
      return;
    }

    flight.monitored = false;

    if (flight.waiters.size > 0) {
      return;
    }

    this.#abort(flight);
  };

  /** Applies a changed scope key: the old key's check ends and its history is cleared. */
  reconcileScope = () => {
    const reading = readScope(this.#definition.scope);

    if (reading.scope === "unscoped") {
      return { reading, changed: false };
    }

    if (reading.key === this.#record.get().scopeKey) {
      return { reading, changed: false };
    }

    const transaction = new Transaction();

    this.#supersede(transaction, "scope-change", this.#createSuperseded());
    this.#cancelExpiry();
    transaction.set(
      this.#record,
      Object.freeze({ ...EMPTY_RECORD_STATE, scopeKey: reading.key }),
    );
    transaction.commit();

    return { reading, changed: true };
  };

  /** Drops the current result and check without checking again. */
  invalidate = () => {
    const transaction = new Transaction();

    this.revoke(transaction, "invalidated", this.#createSuperseded());
    transaction.commit();
  };

  /** Ends the current check and result, inside the caller's transaction. */
  revoke = (transaction: Transaction, reason: string, error: ReachError) => {
    this.#supersede(transaction, reason, error);
    this.#cancelExpiry();

    const record = this.#record.get();

    if (!record.current) {
      return;
    }

    transaction.set(this.#record, Object.freeze({ ...record, current: false }));
  };

  close = () => {
    this.#cancelExpiry();
    this.#record.close();
    this.#expiry.clear();
    this.#settlements.clear();
  };

  #isExpired() {
    const { observation } = this.#record.get();

    if (observation === null) {
      return false;
    }

    return isExpired(
      observation.completion,
      this.#definition.staleAfter,
      this.#environment.clock,
    );
  }

  #createSuperseded() {
    return new ReachError({
      code: "SUPERSEDED",
      message: `The ${this.#definition.name} endpoint's check was superseded.`,
    });
  }

  // The scope as a check about to start reads it. Reconciling runs listeners,
  // which may stop the runtime or change the key again; no check starts then.
  #reconcileForCheck(): ScopeReading | "stopped" | "moved" {
    const { reading } = this.reconcileScope();

    if (!this.#environment.network.isRunning()) {
      return "stopped";
    }

    if (reading.key !== this.#record.get().scopeKey) {
      return "moved";
    }

    return reading;
  }

  #checkNow(signal: AbortSignal | undefined): Promise<CheckResult> {
    // A caller who gave up while the source opened sends nothing.
    if (signal?.aborted === true) {
      return Promise.reject(createAbortedError());
    }

    if (!this.#environment.network.isRunning()) {
      return Promise.reject(createNotStartedError());
    }

    const reading = this.#reconcileForCheck();

    if (reading === "stopped") {
      return Promise.reject(createNotStartedError());
    }

    if (reading === "moved") {
      return Promise.reject(this.#createSuperseded());
    }

    if (reading.error !== null) {
      return Promise.reject(new ReachError(reading.error));
    }

    if (reading.scope === "unavailable") {
      return Promise.reject(
        new ReachError({
          code: "SCOPE_UNAVAILABLE",
          message: `The ${this.#definition.name} endpoint has no scope key to check for.`,
        }),
      );
    }

    const result = createDeferred<CheckResult>();

    const waiter: CheckWaiter = {
      resolve: result.resolve,
      reject: result.reject,
    };

    const flight = this.#flight;

    if (flight !== null) {
      flight.waiters.add(waiter);
      this.#environment.record("check-joined", {
        endpoint: this.#definition.name,
        check: flight.id,
      });

      return waitWithSignal(result.promise, signal, () =>
        this.#removeWaiter(waiter),
      );
    }

    const { capacity } = this.#environment;

    if (capacity.outstanding >= capacity.max) {
      return Promise.reject(
        new ReachError({
          code: "CAPACITY_EXHAUSTED",
          message: `${capacity.outstanding} checks are still running, the most this Reach allows.`,
        }),
      );
    }

    this.#start(reading.key, waiter);

    return waitWithSignal(result.promise, signal, () =>
      this.#removeWaiter(waiter),
    );
  }

  #removeWaiter(waiter: CheckWaiter) {
    const flight = this.#flight;

    if (flight === null) {
      return;
    }

    if (!flight.waiters.delete(waiter)) {
      return;
    }

    this.#environment.changed();

    if (flight.waiters.size > 0) {
      return;
    }

    if (flight.monitored) {
      return;
    }

    this.#abort(flight);
  }

  // The flight and its first owner are in place before the check runs, so a
  // check that reenters Reach joins it instead of starting a second one.
  #start(scopeKey: string | null, waiter: CheckWaiter | null) {
    const { clock, scheduler, capacity, network } = this.#environment;
    const startedAt = clock.now();

    const flight: ProbeFlight = {
      id: this.#environment.nextCheckId(),
      controller: new AbortController(),
      deadline: clock.monotonic() + this.#definition.timeout,
      startedAt,
      networkGeneration: network.getState().generation,
      scopeKey,
      waiters: new Set(waiter === null ? [] : [waiter]),
      monitored: waiter === null,
      settled: false,
      physical: true,
      cancelDeadline: () => {},
    };

    this.#flight = flight;
    this.#lastStart = clock.monotonic();
    capacity.outstanding += 1;
    flight.cancelDeadline = scheduler.schedule(flight.deadline, () =>
      this.#timeOut(flight),
    );

    this.#environment.record("check-started", {
      endpoint: this.#definition.name,
      check: flight.id,
    });

    // A listener may already have ended this check, which then never runs.
    if (flight.settled) {
      this.#release(flight);

      return;
    }

    this.#record.update(
      Object.freeze({
        ...this.#record.get(),
        checking: true,
        lastAttempt: this.#createAttempt(flight, "running", null),
      }),
    );

    if (flight.settled) {
      this.#release(flight);

      return;
    }

    this.#invoke(flight);
  }

  #invoke(flight: ProbeFlight) {
    const context: ProbeContext = Object.freeze({
      signal: flight.controller.signal,
      scope: flight.scopeKey,
    });

    let answer: ProbeResult | PromiseLike<ProbeResult>;

    try {
      answer = this.#definition.check(context);
    } catch (error) {
      this.#fail(flight, error);

      return;
    }

    if (!isPromiseLike(answer)) {
      this.#complete(flight, answer);

      return;
    }

    answer.then(
      (result) => this.#complete(flight, result),
      (error: unknown) => this.#fail(flight, error),
    );
  }

  // The check's own promise settled: its slot is free, whether or not Reach still waited for it.
  #release(flight: ProbeFlight) {
    if (!flight.physical) {
      return;
    }

    flight.physical = false;

    const { capacity } = this.#environment;

    capacity.outstanding -= 1;

    if (flight.settled) {
      capacity.detached -= 1;
    }

    this.#environment.changed();
  }

  // Reach stops waiting; a check that still runs keeps its slot as detached work.
  #finish(flight: ProbeFlight) {
    flight.settled = true;
    flight.cancelDeadline();

    if (this.#flight === flight) {
      this.#flight = null;
    }

    if (flight.physical) {
      this.#environment.capacity.detached += 1;
    }
  }

  // A result that arrives after its deadline loses to the timeout, however the tasks were ordered.
  #isPastDeadline(flight: ProbeFlight) {
    return this.#environment.clock.monotonic() >= flight.deadline;
  }

  #complete(flight: ProbeFlight, { verdict, response, reason }: ProbeResult) {
    this.#release(flight);

    if (flight.settled) {
      return;
    }

    if (this.#isPastDeadline(flight)) {
      this.#timeOut(flight);

      return;
    }

    this.#observe(flight, { verdict, response, reason: reason ?? null });
  }

  // The timeout is committed before the abort, whose listeners may call back into Reach.
  #timeOut(flight: ProbeFlight) {
    if (flight.settled) {
      return;
    }

    this.#observe(flight, TIMEOUT_OUTCOME);
    flight.controller.abort();
  }

  #observe(flight: ProbeFlight, { verdict, response, reason }: Outcome) {
    this.#finish(flight);

    const { clock, scheduler } = this.#environment;
    const completedAt = clock.now();

    const observation = Object.freeze({
      check: flight.id,
      verdict,
      response,
      reason,
      startedAt: flight.startedAt,
      completedAt,
      networkGeneration: flight.networkGeneration,
    });

    const transaction = new Transaction();

    transaction.set(
      this.#record,
      Object.freeze({
        ...this.#record.get(),
        observation: Object.freeze({
          published: observation,
          completion: Object.freeze({
            monotonic: clock.monotonic(),
            wall: completedAt,
          }),
        }),
        current: true,
        checking: false,
        lastAttempt: this.#createAttempt(flight, "observed", reason),
        error: null,
      }),
    );

    this.#cancelExpiry();
    this.#cancelExpiry = scheduler.schedule(
      clock.monotonic() + this.#definition.staleAfter,
      () => {
        this.#expiry.notify();
        this.#environment.changed();
      },
    );

    // The linearization point: every surviving waiter gets the state this result was accepted into.
    const result: CheckResult = Object.freeze({
      observation,
      state: this.state.get(),
    });

    for (const waiter of flight.waiters) {
      waiter.resolve(result);
    }

    flight.waiters.clear();
    transaction.commit();
    this.#environment.record("check-completed", {
      endpoint: this.#definition.name,
      check: flight.id,
      reason: reason ?? verdict,
    });
    this.#settlements.notify();
  }

  #fail(flight: ProbeFlight, cause: unknown) {
    this.#release(flight);

    if (flight.settled) {
      return;
    }

    if (this.#isPastDeadline(flight)) {
      this.#timeOut(flight);

      return;
    }

    this.#finish(flight);

    const error = new ReachError({
      code: "PROBE_ERROR",
      message: `The ${this.#definition.name} endpoint's check threw instead of answering.`,
      cause,
    });

    // A broken check is not a failed endpoint: the previous result stays until it expires.
    this.#record.update(
      Object.freeze({
        ...this.#record.get(),
        checking: false,
        lastAttempt: this.#createAttempt(flight, "error", error.code),
        error: Object.freeze({ code: error.code, message: error.message }),
      }),
    );

    for (const waiter of flight.waiters) {
      waiter.reject(error);
    }

    flight.waiters.clear();
    this.#environment.record("check-failed", {
      endpoint: this.#definition.name,
      check: flight.id,
      reason: error.code,
    });
    this.#settlements.notify();
  }

  #supersede(transaction: Transaction, reason: string, error: ReachError) {
    const flight = this.#flight;

    if (flight === null) {
      return;
    }

    this.#finish(flight);
    transaction.set(
      this.#record,
      Object.freeze({
        ...this.#record.get(),
        checking: false,
        lastAttempt: this.#createAttempt(flight, "superseded", reason),
      }),
    );

    for (const waiter of flight.waiters) {
      waiter.reject(error);
    }

    flight.waiters.clear();
    this.#environment.record("check-superseded", {
      endpoint: this.#definition.name,
      check: flight.id,
      reason,
    });

    // The abort's listeners may start the next check, so they run once this change is committed.
    transaction.after(() => {
      this.#settlements.notify();
      flight.controller.abort();
    });
  }

  // Cancellation is no evidence: it ends the check without an observation.
  #abort(flight: ProbeFlight) {
    this.#finish(flight);
    this.#record.update(
      Object.freeze({
        ...this.#record.get(),
        checking: false,
        lastAttempt: this.#createAttempt(flight, "aborted", null),
      }),
    );
    this.#environment.record("check-aborted", {
      endpoint: this.#definition.name,
      check: flight.id,
    });
    this.#settlements.notify();
    flight.controller.abort();
  }

  #createAttempt(
    flight: ProbeFlight,
    status: EndpointAttempt["status"],
    reason: string | null,
  ): EndpointAttempt {
    return Object.freeze({
      check: flight.id,
      status,
      startedAt: flight.startedAt,
      completedAt: status === "running" ? null : this.#environment.clock.now(),
      reason,
    });
  }
}
