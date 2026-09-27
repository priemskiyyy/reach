/**
 * Running counts of what Reach dropped or contained, kept whether or not
 * anyone listens to events.
 *
 * @example
 * ```ts
 * const { duplicateObservations } = reach.diagnostics.get().counters;
 * ```
 */
export type ReachDiagnosticCounters = {
  duplicateObservations: number;
  discardedObservations: number;
  lateCallbacks: number;
  skippedChecks: number;
  listenerErrors: number;
  cleanupErrors: number;
};
