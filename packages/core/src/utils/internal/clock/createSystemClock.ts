import type { ReachClock } from "src/types/ReachClock";
import { MAX_TIMER_DELAY } from "src/utils/constants/defaults";

/** The host's clocks and timers, read only when used, so creating a Reach on a server reads nothing. */
export const createSystemClock = (): ReachClock => ({
  now: () => Date.now(),
  // A runtime without a monotonic clock falls back to epoch time, which the paired check still guards.
  monotonic: () =>
    typeof performance === "object" ? performance.now() : Date.now(),
  setTimer: (callback, delay) => {
    const timer = setTimeout(
      callback,
      Math.min(Math.max(delay, 0), MAX_TIMER_DELAY),
    );

    return () => clearTimeout(timer);
  },
  random: () => Math.random(),
});
