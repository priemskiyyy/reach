import type { Transport } from "src/types/Transport";

/**
 * The source's coarse description of the primary connection: a transport,
 * `none`, `mixed` for several at once, or `unknown`. A browser's effective
 * type such as `4g` is never one of these.
 *
 * @example
 * ```ts
 * const onWifi = reach.state.get().connection.type === "wifi";
 * ```
 */
export type ConnectionType = Transport | "none" | "mixed" | "unknown";
