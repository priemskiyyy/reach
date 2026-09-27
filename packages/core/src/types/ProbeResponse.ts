/**
 * Whether the check obtained a usable answer: `received`, `not-observed` when
 * it certainly got none, or `unknown`. A received answer can still come from
 * a cache or a service worker, so it never proves the origin was reached.
 *
 * @example
 * ```ts
 * const response: ProbeResponse = "received";
 * ```
 */
export type ProbeResponse = "received" | "not-observed" | "unknown";
