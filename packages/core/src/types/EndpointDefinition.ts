import type { EndpointCheck } from "src/types/EndpointCheck";
import type { MonitoringPolicy } from "src/types/MonitoringPolicy";
import type { ObservableValue } from "src/types/ObservableValue";

/**
 * One named check the application defines once, when it creates its Reach.
 * Both a pass and a fail expire after `staleAfter`; `scope` keeps results of
 * one account or tenant from ever answering for another.
 *
 * @example
 * ```ts
 * const internal: EndpointDefinition = {
 *   staleAfter: 20_000,
 *   check: async ({ signal }) => ({
 *     verdict: (await ping({ signal })) ? "pass" : "fail",
 *     response: "received",
 *   }),
 * };
 * ```
 */
export type EndpointDefinition = {
  check: EndpointCheck;
  /** Milliseconds a completed check stays current. */
  staleAfter: number;
  /** Milliseconds one check may take, 5,000 by default; a check that takes longer fails. */
  timeout?: number;
  /** The current account or tenant key, or `null` while there is none to check for. */
  scope?: ObservableValue<string | null>;
  monitoring?: MonitoringPolicy;
};
