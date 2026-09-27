/**
 * The source's scoped assessment of internet access. `offline` needs an
 * unambiguous native report of no path, and neither value says anything about
 * a particular service; that is what endpoints are for.
 *
 * @example
 * ```ts
 * const status: InternetStatus = reach.state.get().internet.status;
 * ```
 */
export type InternetStatus = "online" | "offline" | "unknown";
