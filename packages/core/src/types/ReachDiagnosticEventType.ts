/**
 * What a diagnostic event records: a lease or session change, what happened
 * to a source report, a refresh, a monitor or a check, or a failure Reach
 * contained.
 *
 * @example
 * ```ts
 * const type: ReachDiagnosticEventType = "observation-duplicate";
 * ```
 */
export type ReachDiagnosticEventType =
  | "lease-acquired"
  | "lease-released"
  | "session-opening"
  | "session-opened"
  | "source-unavailable"
  | "session-failed"
  | "session-stopped"
  | "disposed"
  | "observation-accepted"
  | "observation-duplicate"
  | "observation-discarded"
  | "late-callback"
  | "source-invalidated"
  | "source-error"
  | "refresh-started"
  | "refresh-settled"
  | "monitor-acquired"
  | "monitor-released"
  | "check-started"
  | "check-joined"
  | "check-completed"
  | "check-aborted"
  | "check-superseded"
  | "check-failed"
  | "check-skipped"
  | "listener-error"
  | "cleanup-error";
