import type { Condition } from "src/types/Condition";
import type { EndpointDefinition } from "src/types/EndpointDefinition";
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
  DEFAULT_OPEN_TIMEOUT,
  DEFAULT_REFRESH_TIMEOUT,
} from "src/utils/constants/defaults";
import { createSystemClock } from "src/utils/internal/clock/createSystemClock";
import { freezeList } from "src/utils/internal/common/freezeList";
import { deriveCondition } from "src/utils/internal/conditions/deriveCondition";
import { evaluateRequirements } from "src/utils/internal/conditions/evaluateRequirements";
import { Diagnostics } from "src/utils/internal/diagnostics/Diagnostics";
import { Listeners } from "src/utils/internal/observable/Listeners";
import { resolveDuration } from "src/utils/internal/options/resolveDuration";
import { reportUnhandledError } from "src/utils/internal/reporting/reportUnhandledError";
import { NetworkRuntime } from "src/utils/internal/runtime/NetworkRuntime";

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
export class Reach<
  TNative,
  TEndpoints extends Record<string, EndpointDefinition> = Record<
    never,
    EndpointDefinition
  >,
> {
  #adapter: NetworkAdapter<TNative>;
  #runtime: NetworkRuntime<TNative>;
  #diagnostics: Diagnostics;

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
   * const metering = reach.capabilities.get()?.fields["cost.metered"].support;
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
    timeouts = {},
    clock = createSystemClock(),
  }: ReachOptions<TNative, TEndpoints>) {
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

    this.#adapter = adapter;
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

    this.#runtime = new NetworkRuntime({
      adapter,
      clock,
      timeouts: resolvedTimeouts,
      createListeners: () => new Listeners(reportListenerError),
      hooks: {
        onGeneration: () => {},
        onStop: () => {},
        onAdopt: () => {},
        onNetworkChange: () => {},
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
    this.#diagnostics.close();
  };

  #collectDiagnostics(
    counters: ReachDiagnosticCounters,
  ): ReachDiagnosticSnapshot {
    const state = this.#runtime.state.get();
    const session = this.#runtime.sessionId();

    return Object.freeze({
      runtime: this.#runtime.status.get().state,
      adapter: Object.freeze({ name: this.#adapter.name }),
      session: session === null ? null : Object.freeze({ id: session }),
      networkGeneration: state.generation,
      capabilities: this.#runtime.capabilities.get(),
      leases: this.#runtime.leaseCount(),
      checks: Object.freeze({ outstanding: 0, detached: 0 }),
      endpoints: freezeList([]),
      counters,
    });
  }
}
