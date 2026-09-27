/**
 * What makes a monitored endpoint check again: the runtime `start`, an
 * observed `network-change`, a return to the `foreground`, or a
 * `scope-change`. Expiry is never a trigger.
 *
 * @example
 * ```ts
 * const on: MonitorTrigger[] = ["start", "network-change", "foreground"];
 * ```
 */
export type MonitorTrigger =
  "start" | "network-change" | "foreground" | "scope-change";
