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
 *     console.debug(event.endpoint?.name, event.reason);
 *   }
 * });
 * ```
 */
export type ReachDiagnosticEvent = {
  type: ReachDiagnosticEventType;
  /** Epoch milliseconds on the Reach clock. */
  timestamp: number;
  session: { id: number } | null;
  networkGeneration: number;
  endpoint: { name: string } | null;
  check: { id: number } | null;
  /** Why it happened, such as `obsolete`, `background` or an error code. */
  reason: string | null;
};
