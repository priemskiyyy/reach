import type { ReachDiagnosticEventType } from "src/types/ReachDiagnosticEventType";

/**
 * One frozen record of something Reach did. It names sessions, generations,
 * endpoints and checks by number and name, and a short `reason` code, never a
 * URL, a scope key, a header or a provider payload.
 *
 * @example
 * ```ts
 * reach.diagnostics.events.subscribe((event) => {
 *   if (event.type === "check-skipped") {
 *     console.debug(event.endpoint, event.reason);
 *   }
 * });
 * ```
 */
export type ReachDiagnosticEvent = {
  type: ReachDiagnosticEventType;
  /** Epoch milliseconds on the Reach clock. */
  timestamp: number;
  /** The number of the session, or `null` outside one. */
  session: number | null;
  networkGeneration: number;
  /** The endpoint, by name, or `null`. */
  endpoint: string | null;
  check: number | null;
  /** Why it happened, such as `obsolete`, `background` or an error code. */
  reason: string | null;
};
