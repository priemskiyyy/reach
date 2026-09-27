/**
 * What Query hears while the condition is unknown: `online`, the default,
 * lets Query attempt requests; `offline` pauses them; `preserve` publishes
 * nothing and leaves the manager as it is.
 *
 * @example
 * ```ts
 * const options: OnlineEventListenerOptions = { unknown: "preserve" };
 * ```
 */
export type OnlineEventListenerOptions = {
  unknown?: "online" | "offline" | "preserve";
};
