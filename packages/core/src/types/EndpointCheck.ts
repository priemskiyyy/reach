import type { ProbeContext } from "src/types/ProbeContext";
import type { ProbeResult } from "src/types/ProbeResult";

/**
 * The application's own check for one endpoint. It answers a verdict, or
 * throws when the check itself is broken, which is never a failed endpoint.
 *
 * @example
 * ```ts
 * const check: EndpointCheck = async ({ signal }) => ({
 *   verdict: (await api.health({ signal })).ready ? "pass" : "fail",
 *   response: "received",
 * });
 * ```
 */
export type EndpointCheck = (
  context: ProbeContext,
) => ProbeResult | Promise<ProbeResult>;
