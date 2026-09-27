/**
 * What went wrong, for an error Reach created. None of them says anything
 * about the network: an offline device is state, never an error.
 *
 * - `INVALID_CONFIGURATION`: options that cannot work, such as a negative
 *   duration or an endpoint name that was never defined.
 * - `UNSUPPORTED_ENVIRONMENT`: an adapter started where its source does not
 *   exist, such as the browser adapter on a server.
 * - `NOT_STARTED`: an operation that needs a runtime lease ran without one.
 * - `DISPOSED`: an operation ran after `dispose()`.
 * - `RELEASED`: a lease was released before its source was ready.
 * - `ABORTED`: the caller's signal aborted its own wait.
 * - `SUPERSEDED`: the session, network or scope changed under the operation.
 * - `SCOPE_UNAVAILABLE`: a scoped endpoint has no current scope key.
 * - `SOURCE_ERROR`: the adapter failed to open, read or refresh.
 * - `SOURCE_TIMEOUT`: opening or refreshing the adapter took too long.
 * - `PROBE_ERROR`: an endpoint check threw instead of answering.
 * - `CAPACITY_EXHAUSTED`: too many checks are still physically running.
 * - `EVALUATION_ERROR`: a condition's evaluator or source threw.
 * - `LISTENER_ERROR`: an application listener threw.
 * - `CLEANUP_ERROR`: a cleanup threw during release or disposal.
 *
 * @example
 * ```ts
 * const code: ReachErrorCode = "SCOPE_UNAVAILABLE";
 * ```
 */
export type ReachErrorCode =
  | "INVALID_CONFIGURATION"
  | "UNSUPPORTED_ENVIRONMENT"
  | "NOT_STARTED"
  | "DISPOSED"
  | "RELEASED"
  | "ABORTED"
  | "SUPERSEDED"
  | "SCOPE_UNAVAILABLE"
  | "SOURCE_ERROR"
  | "SOURCE_TIMEOUT"
  | "PROBE_ERROR"
  | "CAPACITY_EXHAUSTED"
  | "EVALUATION_ERROR"
  | "LISTENER_ERROR"
  | "CLEANUP_ERROR";
