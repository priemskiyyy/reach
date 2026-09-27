export type RequestOutcome =
  | "ready"
  | "degraded"
  | "stored"
  | "unavailable"
  | "aborted"
  | "no-signal"
  | "portal";
