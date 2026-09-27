/**
 * What one check concluded under the application's own contract: `pass`
 * makes the endpoint available, `fail` unavailable, and `inconclusive` leaves
 * it unknown.
 *
 * @example
 * ```ts
 * const verdict: ProbeVerdict = response.ok ? "pass" : "fail";
 * ```
 */
export type ProbeVerdict = "pass" | "fail" | "inconclusive";
