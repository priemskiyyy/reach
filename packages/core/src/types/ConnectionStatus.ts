/**
 * Whether the source reports a usable connection. On a browser it is a hint
 * from `navigator.onLine`, and `connected` never means the internet works.
 *
 * @example
 * ```ts
 * const status: ConnectionStatus = reach.state.get().connection.status;
 * ```
 */
export type ConnectionStatus = "connected" | "disconnected" | "unknown";
