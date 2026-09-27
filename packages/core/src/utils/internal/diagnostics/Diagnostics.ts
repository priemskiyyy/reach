import type { DiagnosticDetails } from "src/types/internal/DiagnosticDetails";
import type { ReachClock } from "src/types/ReachClock";
import type { ReachDiagnosticCounters } from "src/types/ReachDiagnosticCounters";
import type { ReachDiagnosticEvent } from "src/types/ReachDiagnosticEvent";
import type { ReachDiagnosticEventType } from "src/types/ReachDiagnosticEventType";
import type { ReachDiagnostics } from "src/types/ReachDiagnostics";
import type { ReachDiagnosticSnapshot } from "src/types/ReachDiagnosticSnapshot";
import { COUNTED_EVENTS } from "src/utils/constants/diagnostics";
import { Listeners } from "src/utils/internal/observable/Listeners";
import { isolate } from "src/utils/internal/reporting/isolate";
import { reportUnhandledError } from "src/utils/internal/reporting/reportUnhandledError";

type EventRegistration = { listener: (event: ReachDiagnosticEvent) => void };

type DiagnosticsOptions = {
  clock: ReachClock;
  /** Where each event happened, read only when an event is built. */
  getContext: () => { session: number | null; networkGeneration: number };
  /** The snapshot's own facts, read only when the snapshot is read. */
  collect: (counters: ReachDiagnosticCounters) => ReachDiagnosticSnapshot;
};

// Diagnostics never create demand: an event is built only while someone
// listens, and the snapshot is assembled only when read.
export class Diagnostics {
  #clock: ReachClock;
  #getContext: DiagnosticsOptions["getContext"];
  #collect: DiagnosticsOptions["collect"];
  #events = new Set<EventRegistration>();
  #snapshotListeners = new Listeners();
  #counters: ReachDiagnosticCounters = {
    duplicateObservations: 0,
    discardedObservations: 0,
    lateCallbacks: 0,
    skippedChecks: 0,
    listenerErrors: 0,
    cleanupErrors: 0,
  };

  #snapshot: ReachDiagnosticSnapshot | null = null;
  #announcing = false;
  #closed = false;

  constructor({ clock, getContext, collect }: DiagnosticsOptions) {
    this.#clock = clock;
    this.#getContext = getContext;
    this.#collect = collect;
  }

  record = (
    type: ReachDiagnosticEventType,
    details: DiagnosticDetails = {},
  ) => {
    if (this.#closed) {
      return;
    }

    const counter = COUNTED_EVENTS[type];

    if (counter !== undefined) {
      this.#counters[counter] += 1;
    }

    this.changed();

    if (this.#events.size === 0) {
      return;
    }

    this.#emit(this.#createEvent(type, details));
  };

  /** Tells the snapshot's observers once the current work is done. */
  changed = () => {
    if (this.#announcing) {
      return;
    }

    if (this.#snapshotListeners.size() === 0) {
      return;
    }

    this.#announcing = true;
    queueMicrotask(this.#announce);
  };

  /** Delivers the final snapshot at once and ends every observation. */
  close = () => {
    if (this.#closed) {
      return;
    }

    this.#snapshotListeners.notify();
    this.#closed = true;
    this.#snapshotListeners.clear();
    this.#events.clear();
  };

  view: ReachDiagnostics = Object.freeze({
    get: () => this.#getSnapshot(),
    subscribe: (listener: () => void) => {
      if (this.#closed) {
        return () => {};
      }

      return this.#snapshotListeners.add(listener);
    },
    events: Object.freeze({
      subscribe: (listener: (event: ReachDiagnosticEvent) => void) => {
        if (this.#closed) {
          return () => {};
        }

        const registration: EventRegistration = { listener };

        this.#events.add(registration);

        return () => {
          this.#events.delete(registration);
        };
      },
    }),
  });

  // Collected on every read, since time and changes without an event move it
  // too; an equal snapshot keeps its identity. It is plain data built in one
  // key order, so its JSON tells equal ones apart.
  #getSnapshot() {
    const previous = this.#snapshot;
    const next = this.#collect(Object.freeze({ ...this.#counters }));

    if (
      previous !== null &&
      JSON.stringify(previous) === JSON.stringify(next)
    ) {
      return previous;
    }

    this.#snapshot = next;

    return next;
  }

  #announce = () => {
    this.#announcing = false;

    if (this.#closed) {
      return;
    }

    this.#snapshotListeners.notify();
  };

  #createEvent(
    type: ReachDiagnosticEventType,
    { endpoint, check, reason }: DiagnosticDetails,
  ): ReachDiagnosticEvent {
    const { session, networkGeneration } = this.#getContext();

    return Object.freeze({
      type,
      timestamp: this.#clock.now(),
      session,
      networkGeneration,
      endpoint: endpoint ?? null,
      check: check ?? null,
      reason: reason ?? null,
    });
  }

  // A throwing event listener is rethrown outside, never recorded, so it cannot loop.
  #emit(event: ReachDiagnosticEvent) {
    for (const registration of [...this.#events]) {
      if (!this.#events.has(registration)) {
        continue;
      }

      isolate(() => registration.listener(event), reportUnhandledError);
    }
  }
}
