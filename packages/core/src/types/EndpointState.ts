import type { EndpointAttempt } from "src/types/EndpointAttempt";
import type { EndpointObservation } from "src/types/EndpointObservation";
import type { ReachErrorInfo } from "src/types/ReachErrorInfo";

/**
 * One frozen view of an endpoint. `status` counts only a current result:
 * both a pass and a fail become `unknown` once `stale`, and `fresh` means
 * recent, not successful. `checking` is separate, so a running recheck never
 * hides the result it may replace.
 *
 * @example
 * ```ts
 * const { status, freshness, checking } = api.state.get();
 * ```
 */
export type EndpointState = {
  status: "available" | "unavailable" | "unknown";
  freshness: "never" | "fresh" | "stale";
  checking: boolean;
  /** `unscoped` without a scope source, and `unavailable` while it has no key. */
  scope: "unscoped" | "available" | "unavailable";
  lastObservation: EndpointObservation | null;
  lastAttempt: EndpointAttempt | null;
  /** What broke the latest attempt itself, such as a throwing check; never a failed endpoint. */
  error: ReachErrorInfo | null;
};
