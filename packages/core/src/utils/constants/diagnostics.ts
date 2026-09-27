import type { ReachDiagnosticCounters } from "src/types/ReachDiagnosticCounters";
import type { ReachDiagnosticEventType } from "src/types/ReachDiagnosticEventType";

/** The counter each counted event type adds to. */
export const COUNTED_EVENTS: Partial<
  Record<ReachDiagnosticEventType, keyof ReachDiagnosticCounters>
> = Object.freeze({
  "observation-duplicate": "duplicateObservations",
  "observation-discarded": "discardedObservations",
  "late-callback": "lateCallbacks",
  "check-skipped": "skippedChecks",
  "listener-error": "listenerErrors",
  "cleanup-error": "cleanupErrors",
});
