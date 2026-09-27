import type { Condition } from "src/types/Condition";
import type { EndpointHandle } from "src/types/EndpointHandle";
import type { NetworkAdapter } from "src/types/NetworkAdapter";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import type { NetworkRequirements } from "src/types/NetworkRequirements";
import type { NetworkState } from "src/types/NetworkState";
import type { ObservableValue } from "src/types/ObservableValue";
import type { OperationOptions } from "src/types/OperationOptions";
import type { ReachDiagnosticCounters } from "src/types/ReachDiagnosticCounters";
import type { ReachDiagnostics } from "src/types/ReachDiagnostics";
import type { ReachDiagnosticSnapshot } from "src/types/ReachDiagnosticSnapshot";
import type { ReachOptions } from "src/types/ReachOptions";
import type { RefreshResult } from "src/types/RefreshResult";
import type { RuntimeLease } from "src/types/RuntimeLease";
import type { RuntimeStatus } from "src/types/RuntimeStatus";
import {
  DEFAULT_MAX_OUTSTANDING_CHECKS,
  DEFAULT_OPEN_TIMEOUT,
  DEFAULT_REFRESH_TIMEOUT,
} from "src/utils/constants/defaults";
import { createSystemClock } from "src/utils/internal/clock/createSystemClock";
import { deriveCondition } from "src/utils/internal/conditions/deriveCondition";
import { evaluateRequirements } from "src/utils/internal/conditions/evaluateRequirements";
import { Diagnostics } from "src/utils/internal/diagnostics/Diagnostics";
import { EndpointRegistry } from "src/utils/internal/endpoints/EndpointRegistry";
import { Listeners } from "src/utils/internal/observable/Listeners";
import { resolveCount } from "src/utils/internal/options/resolveCount";
import { resolveDuration } from "src/utils/internal/options/resolveDuration";
import { reportUnhandledError } from "src/utils/internal/reporting/reportUnhandledError";
import { NetworkRuntime } from "src/utils/internal/runtime/NetworkRuntime";
import { ReachError } from "src/utils/ReachError";
import { DeadlineScheduler } from "src/utils/internal/scheduling/DeadlineScheduler";

/**
 * One application-owned model of network evidence over one connectivity
 * adapter. Constructing it, reading it and subscribing to it start nothing;
 * `start()` acquires a lease that opens the source, and `dispose()` ends it
 * for good.
 *
 * @example
 * ```ts
 * const reach = new Reach({ adapter: browser() });
 * const internet = reach.condition({ internet: "online" });
 * const lease = reach.start();
 *
 * await lease.ready;
 * console.log(internet.get().status);
 * lease.release();
 * ```
 */
export class Reach<TNative, TName extends string = never> {
  #adapter: NetworkAdapter<TNative>;
  #runtime: NetworkRuntime<TNative>;
  #endpoints: EndpointRegistry;
  #diagnostics: Diagnostics;
  #capacity: { outstanding: number; detached: number; max: number };

  /**
   * The normalized facts and their evidence, as one frozen snapshot that
   * keeps its identity until something meaningful changes.
   *
   * @example
   * ```ts
   * const { connection, internet } = reach.state.get();
   * ```
   */
  state: ObservableValue<NetworkState>;

  /**
   * Where the runtime stands: idle, starting, running, error or disposed.
   *
   * @example
   * ```ts
   * const running = reach.status.get().state === "running";
   * ```
   */
  status: ObservableValue<RuntimeStatus>;

  /**
   * What the opened source can observe, or `null` while no session is adopted.
   *
   * @example
   * ```ts
   * const metering = reach.capabilities.get()?.["cost.metered"].support;
   * ```
   */
  capabilities: ObservableValue<NetworkCapabilities | null>;

  /**
   * The adapter's own provider object for the adopted session, or `null`.
   * Configuring or tearing it down through this handle can break the
   * adapter's assumptions.
   *
   * @example
   * ```ts
   * const native = reach.native.get();
   * ```
   */
  native: ObservableValue<TNative | null>;

  /**
   * A passive snapshot and event stream for logs and devtools.
   *
   * @example
   * ```ts
   * const { leases } = reach.diagnostics.get();
   * ```
   */
  diagnostics: ReachDiagnostics;

  constructor({
    adapter,
    endpoints,
    activity,
    timeouts = {},
    maxOutstandingChecks,
    clock = createSystemClock(),
  }: ReachOptions<TNative, TName>) {
    const resolvedTimeouts = {
      open: resolveDuration(
        "timeouts.open",
        timeouts.open,
        DEFAULT_OPEN_TIMEOUT,
      ),
      refresh: resolveDuration(
        "timeouts.refresh",
        timeouts.refresh,
        DEFAULT_REFRESH_TIMEOUT,
      ),
    };

    let checks = 0;

    this.#adapter = adapter;
    this.#capacity = {
      outstanding: 0,
      detached: 0,
      max: resolveCount(
        "maxOutstandingChecks",
        maxOutstandingChecks,
        DEFAULT_MAX_OUTSTANDING_CHECKS,
      ),
    };

    this.#diagnostics = new Diagnostics({
      clock,
      getContext: () => ({
        session: this.#runtime.sessionId(),
        networkGeneration: this.#runtime.state.get().generation,
      }),
      collect: (counters) => this.#collectDiagnostics(counters),
    });

    const reportListenerError = (error: unknown) => {
      this.#diagnostics.record("listener-error");
      reportUnhandledError(error);
    };

    const createListeners = () => new Listeners(reportListenerError);

    this.#endpoints = new EndpointRegistry(
      endpoints ?? {},
      {
        clock,
        scheduler: new DeadlineScheduler(clock),
        network: {
          getState: () => this.#runtime.state.get(),
          isRunning: () => this.#runtime.isRunning(),
          isDisposed: () => this.#runtime.isDisposed(),
          whenRunning: (signal) => this.#runtime.whenRunning(signal),
          advanceGeneration: () => this.#runtime.advanceGeneration(),
          refresh: () => this.#runtime.refresh(),
        },
        capacity: this.#capacity,
        nextCheckId: () => {
          checks += 1;

          return checks;
        },
        record: this.#diagnostics.record,
        changed: this.#diagnostics.changed,
        createListeners,
      },
      activity ?? null,
    );

    this.#runtime = new NetworkRuntime({
      adapter,
      clock,
      timeouts: resolvedTimeouts,
      createListeners,
      hooks: {
        onGeneration: (transaction) =>
          this.#endpoints.revoke(
            transaction,
            "network-change",
            new ReachError({
              code: "SUPERSEDED",
              message: "The network changed during the check.",
            }),
          ),
        onStop: this.#endpoints.stop,
        onAdopt: this.#endpoints.adopt,
        onNetworkChange: () => this.#endpoints.offer("network-change"),
        record: this.#diagnostics.record,
        reportCleanupError: (error) => {
          this.#diagnostics.record("cleanup-error");
          reportUnhandledError(error);
        },
      },
    });

    this.state = this.#runtime.state.observable;
    this.status = this.#runtime.status.observable;
    this.capabilities = this.#runtime.capabilities.observable;
    this.native = this.#runtime.native.observable;
    this.diagnostics = this.#diagnostics.view;
  }

  /**
   * Acquires one runtime lease. The first opens the adapter, later ones
   * share its session, and the last release stops it.
   *
   * @example
   * ```ts
   * const lease = reach.start();
   *
   * await lease.ready;
   * ```
   */
  start = (): RuntimeLease => this.#runtime.start();

  /**
   * Reads the source again, sharing one refresh among concurrent callers. It
   * never checks an endpoint, and rejects without a lease.
   *
   * @example
   * ```ts
   * const { status } = await reach.refresh();
   * ```
   */
  refresh = (options?: OperationOptions): Promise<RefreshResult> =>
    this.#runtime.refresh(options);

  /**
   * A passive condition over the current facts: met when every given fact
   * currently has exactly the given value.
   *
   * @example
   * ```ts
   * const bulk = reach.condition({ internet: "online", metered: false });
   * ```
   */
  condition = (requirements: NetworkRequirements): Condition => {
    const required = Object.freeze({ ...requirements });

    return deriveCondition([this.state], () =>
      evaluateRequirements(this.state.get(), required),
    );
  };

  /**
   * The stable handle of one endpoint defined in the options. A name that
   * was never defined fails to compile, and throws `INVALID_CONFIGURATION`
   * when it arrives from untyped code.
   *
   * @example
   * ```ts
   * const api = reach.endpoint("api");
   * ```
   */
  endpoint = (name: TName): EndpointHandle => this.#endpoints.get(name);

  /**
   * Ends the Reach for good: the source closes, every pending operation
   * settles, and the last snapshots stay readable.
   *
   * @example
   * ```ts
   * reach.dispose();
   * ```
   */
  dispose = () => {
    if (this.#runtime.isDisposed()) {
      return;
    }

    this.#runtime.dispose();
    this.#endpoints.close();
    this.#diagnostics.close();
  };

  #collectDiagnostics(
    counters: ReachDiagnosticCounters,
  ): ReachDiagnosticSnapshot {
    const state = this.#runtime.state.get();

    return Object.freeze({
      runtime: this.#runtime.status.get().state,
      adapter: this.#adapter.name,
      session: this.#runtime.sessionId(),
      networkGeneration: state.generation,
      capabilities: this.#runtime.capabilities.get(),
      leases: this.#runtime.leaseCount(),
      checks: Object.freeze({
        outstanding: this.#capacity.outstanding,
        detached: this.#capacity.detached,
      }),
      endpoints: this.#endpoints.collect(),
      counters,
    });
  }
}
