import type { ReachClock } from "src/types/ReachClock";

/**
 * A manual `ReachClock` for tests. `advance` runs timers in the order they
 * fall due and at their own time, and `runDue` runs those already due; `skip`
 * moves time as a frozen page does, and `setNow` moves epoch time alone,
 * backwards included.
 *
 * @example
 * ```ts
 * const clock = createTestClock();
 * const reach = new Reach({ adapter, clock });
 *
 * clock.advance(30_000);
 * ```
 */
export type TestClock = ReachClock & {
  /** Moves both clocks forward, running every timer that falls due on the way. */
  advance: (milliseconds: number) => void;
  /** Moves both clocks forward without running a timer, as a suspended runtime does. */
  skip: (milliseconds: number) => void;
  /** Runs every timer that is already due. */
  runDue: () => void;
  /** Sets epoch time alone, as a clock correction or a sleep with a paused monotonic clock does. */
  setNow: (epochMilliseconds: number) => void;
  /** Sets what `random()` answers from now on. */
  setRandom: (value: number) => void;
  /** Timers armed and neither run nor cancelled. */
  pendingTimers: () => number;
};
