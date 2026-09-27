import type { MonitorTrigger } from "src/types/MonitorTrigger";

/**
 * How a monitored endpoint checks on its own, shared by every `monitor()`
 * owner. It never retries a failure and never catches up on missed ticks; an
 * `interval` needs an activity source, or `allowWithoutActivity`.
 *
 * @example
 * ```ts
 * const monitoring: MonitoringPolicy = {
 *   on: ["start", "network-change", "foreground"],
 *   interval: 60_000,
 * };
 * ```
 */
export type MonitoringPolicy = {
  /** The triggers that start a check, `["start", "network-change"]` by default; a list replaces the default. */
  on?: MonitorTrigger[];
  /** Milliseconds between automatic checks, or `false`, the default, for none. */
  interval?: number | false;
  /** Milliseconds between two automatic starts, 1,000 by default. */
  minInterval?: number;
  /** Lets an `interval` run without an activity source to pause it in the background. */
  allowWithoutActivity?: boolean;
  /** Whether a native report of no path skips automatic checks, `skip` by default. */
  whenOffline?: "skip" | "attempt";
  /** Delays each interval by up to this share of it, from 0, the default, to 1. */
  jitter?: number;
};
