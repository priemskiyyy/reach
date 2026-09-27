/**
 * Whether the application may run automatic checks now. Only `foreground`
 * admits them; `unknown` is not foreground, and none of the three says
 * anything about the network.
 *
 * @example
 * ```ts
 * const activity: ObservableValue<Activity> = {
 *   get: () => (document.visibilityState === "visible" ? "foreground" : "background"),
 *   subscribe: (listener) => {
 *     document.addEventListener("visibilitychange", listener);
 *
 *     return () => document.removeEventListener("visibilitychange", listener);
 *   },
 * };
 * ```
 */
export type Activity = "foreground" | "background" | "unknown";
