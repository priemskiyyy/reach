/**
 * Every time source and timer Reach uses. Durations run on `monotonic` and
 * published timestamps on `now`; freshness ends when either says it has, so a
 * sleep or a clock correction never extends a result. Tests pass
 * `createTestClock()` from `@priemskiyyy/reach/mock`.
 *
 * @example
 * ```ts
 * const clock: ReachClock = {
 *   now: () => Date.now(),
 *   monotonic: () => performance.now(),
 *   setTimer: (callback, delay) => {
 *     const timer = setTimeout(callback, delay);
 *
 *     return () => clearTimeout(timer);
 *   },
 *   random: Math.random,
 * };
 * ```
 */
export type ReachClock = {
  /** Epoch milliseconds, for published timestamps. */
  now: () => number;
  /** Milliseconds from an arbitrary origin that never goes back, for durations. */
  monotonic: () => number;
  /** Runs `callback` once after `delay` milliseconds and answers its cancel. */
  setTimer: (callback: () => void, delay: number) => () => void;
  /** A number from 0 up to 1, for monitoring jitter. */
  random: () => number;
};
