import type { ObservableValue } from "src/types/ObservableValue";
import type { ReachDiagnosticEvent } from "src/types/ReachDiagnosticEvent";
import type { ReachDiagnosticSnapshot } from "src/types/ReachDiagnosticSnapshot";

/**
 * A passive view for logs and devtools: the current snapshot as an
 * observable, and a stream of events that never replays. Observing either
 * starts nothing, and events are only built while someone listens.
 *
 * @example
 * ```ts
 * const stop = reach.diagnostics.events.subscribe((event) => console.debug(event.type));
 * ```
 */
export type ReachDiagnostics = ObservableValue<ReachDiagnosticSnapshot> & {
  events: {
    subscribe: (listener: (event: ReachDiagnosticEvent) => void) => () => void;
  };
};
