import type { ProbeResponse } from "src/types/ProbeResponse";
import type { ProbeVerdict } from "src/types/ProbeVerdict";

/**
 * What one check answers: its verdict, whether it received an answer, and an
 * optional short code for why, such as `not-ready`. Reach keeps this small
 * outcome and never the application's response.
 *
 * @example
 * ```ts
 * const result: ProbeResult = { verdict: "fail", response: "received", reason: "not-ready" };
 * ```
 */
export type ProbeResult = {
  verdict: ProbeVerdict;
  response: ProbeResponse;
  reason?: string;
};
