import type { Activity } from "src/types/Activity";
import type { EndpointDefinition } from "src/types/EndpointDefinition";
import type { EndpointHandle } from "src/types/EndpointHandle";
import type { EndpointEnvironment } from "src/types/internal/EndpointEnvironment";
import type { MonitorTrigger } from "src/types/MonitorTrigger";
import type { ObservableValue } from "src/types/ObservableValue";
import type { OperationOptions } from "src/types/OperationOptions";
import type { ReachDiagnosticSnapshot } from "src/types/ReachDiagnosticSnapshot";
import { freezeList } from "src/utils/internal/common/freezeList";
import { EndpointMonitor } from "src/utils/internal/endpoints/EndpointMonitor";
import { EndpointRecord } from "src/utils/internal/endpoints/EndpointRecord";
import { resolveEndpoint } from "src/utils/internal/endpoints/resolveEndpoint";
import { createDisposedError } from "src/utils/internal/errors/createDisposedError";
import type { Transaction } from "src/utils/internal/observable/Transaction";
import { isolate } from "src/utils/internal/reporting/isolate";
import { ReachError } from "src/utils/ReachError";

type Entry = {
  record: EndpointRecord;
  monitor: EndpointMonitor;
  handle: EndpointHandle;
};

const readActivity = (activity: ObservableValue<Activity>): Activity => {
  try {
    return activity.get();
  } catch {
    // A failing source is no evidence of the foreground.
    return "unknown";
  }
};

// Every endpoint of one Reach, keyed by own name so `__proto__` is just a name.
export class EndpointRegistry {
  #entries = new Map<string, Entry>();
  #environment: EndpointEnvironment;
  #activity: ObservableValue<Activity> | null;
  #lastActivity: Activity = "unknown";
  #subscriptions: Array<() => void> = [];

  constructor(
    definitions: Record<string, EndpointDefinition>,
    environment: EndpointEnvironment,
    activity: ObservableValue<Activity> | null,
  ) {
    this.#environment = environment;
    this.#activity = activity;

    for (const [name, definition] of Object.entries(definitions)) {
      const resolved = resolveEndpoint(name, definition, activity !== null);
      const record = new EndpointRecord(resolved, environment);

      const monitor = new EndpointMonitor(
        record,
        resolved,
        environment,
        this.#isForeground,
      );

      this.#entries.set(name, {
        record,
        monitor,
        handle: this.#createHandle(name, record, monitor),
      });
    }
  }

  get = (name: string) => {
    const entry = this.#entries.get(name);

    if (entry === undefined) {
      throw new ReachError({
        code: "INVALID_CONFIGURATION",
        message: `No endpoint is named "${name}". Define it in the endpoints option.`,
      });
    }

    return entry.handle;
  };

  /** Ends every check and current result inside the caller's transaction. */
  revoke = (transaction: Transaction, reason: string, error: ReachError) => {
    for (const { record } of this.#entries.values()) {
      record.revoke(transaction, reason, error);
    }
  };

  /** A session was adopted: observe scopes and activity, then admit the start trigger. */
  adopt = () => {
    for (const { record } of this.#entries.values()) {
      record.reconcileScope();
    }

    this.#subscribeWhileRunning();
    this.offer("start");
  };

  offer = (trigger: MonitorTrigger) => {
    for (const { monitor } of this.#entries.values()) {
      monitor.offer(trigger);
    }
  };

  /** The runtime stopped: every check ends and nothing waits on a timer. */
  stop = (transaction: Transaction, error: ReachError) => {
    this.#unsubscribe();
    this.revoke(transaction, "runtime-stopped", error);

    for (const { monitor } of this.#entries.values()) {
      monitor.pause();
    }
  };

  close = () => {
    for (const { record } of this.#entries.values()) {
      record.close();
    }
  };

  collect = (): ReachDiagnosticSnapshot["endpoints"] =>
    freezeList(
      [...this.#entries.entries()].map(([name, { record, monitor }]) =>
        Object.freeze({
          name,
          monitors: monitor.owners(),
          waiters: record.waiterCount(),
          status: record.state.get().status,
          checking: record.isChecking(),
        }),
      ),
    );

  #isForeground = () => {
    if (this.#activity === null) {
      return true;
    }

    return this.#lastActivity === "foreground";
  };

  #createHandle(
    name: string,
    record: EndpointRecord,
    monitor: EndpointMonitor,
  ): EndpointHandle {
    return Object.freeze({
      name,
      state: record.state,
      available: record.available,
      check: ({ signal }: OperationOptions = {}) => record.check(signal),
      monitor: () => {
        if (this.#environment.network.isDisposed()) {
          throw createDisposedError();
        }

        return monitor.acquire();
      },
      invalidate: record.invalidate,
    });
  }

  #subscribeWhileRunning() {
    for (const { record, monitor } of this.#entries.values()) {
      const scope = record.scope();

      if (scope === null) {
        continue;
      }

      this.#subscribe(scope, () => {
        const { reading, changed } = record.reconcileScope();

        if (!changed) {
          return;
        }

        // Losing the key ends checks; only a new key is something to check.
        if (reading.key === null) {
          return;
        }

        monitor.offer("scope-change");
      });
    }

    const activity = this.#activity;

    if (activity === null) {
      return;
    }

    // The value at adoption is its baseline, never a trigger of its own.
    this.#lastActivity = readActivity(activity);
    this.#subscribe(activity, () => this.#handleActivity(activity));
  }

  // The application's own observable: one whose subscribe throws is reported, and every read still reconciles.
  #subscribe(source: ObservableValue<unknown>, listener: () => void) {
    try {
      this.#subscriptions.push(source.subscribe(listener));
    } catch (error) {
      this.#environment.reportListenerError(error);
    }
  }

  #unsubscribe() {
    const subscriptions = this.#subscriptions;

    this.#subscriptions = [];

    for (const unsubscribe of subscriptions) {
      isolate(unsubscribe, this.#environment.reportCleanupError);
    }
  }

  #handleActivity(activity: ObservableValue<Activity>) {
    const next = readActivity(activity);
    const previous = this.#lastActivity;

    this.#lastActivity = next;

    if (next === previous) {
      return;
    }

    if (next !== "foreground") {
      for (const { monitor } of this.#entries.values()) {
        monitor.pause();
      }

      return;
    }

    this.#handleForeground();
  }

  // A return to the foreground is a gap: older results end, the source is read
  // once, and only then may foreground-triggered checks start.
  #handleForeground() {
    const { network } = this.#environment;

    network.advanceGeneration();

    // A refresh that fails has already put its failure into the state.
    network.refresh().catch(() => {});

    for (const { monitor } of this.#entries.values()) {
      monitor.offer("foreground");
      monitor.resume();
    }
  }
}
