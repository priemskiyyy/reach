import type { TestClock } from "src/mock/types/TestClock";

type Timer = { id: number; at: number; callback: () => void };

/**
 * A manual clock that starts at the given epoch and monotonic times, zero by
 * default, and runs its timers only when a test advances it.
 *
 * @example
 * ```ts
 * const clock = createTestClock({ now: 1_000 });
 *
 * clock.setTimer(() => console.log(clock.now()), 500);
 * clock.advance(500); // logs 1_500
 * ```
 */
export const createTestClock = ({
  now: initialNow = 0,
  monotonic: initialMonotonic = 0,
}: { now?: number; monotonic?: number } = {}): TestClock => {
  let wall = initialNow;
  let monotonic = initialMonotonic;
  let random = 0;
  let nextId = 0;
  const timers = new Map<number, Timer>();

  const getNextDue = (limit: number) => {
    let next: Timer | null = null;

    for (const timer of timers.values()) {
      if (timer.at > limit) {
        continue;
      }

      if (next !== null && next.at <= timer.at) {
        continue;
      }

      next = timer;
    }

    return next;
  };

  const move = (milliseconds: number) => {
    wall += milliseconds;
    monotonic += milliseconds;
  };

  const run = (timer: Timer) => {
    timers.delete(timer.id);
    timer.callback();
  };

  return Object.freeze({
    now: () => wall,
    monotonic: () => monotonic,
    setTimer: (callback: () => void, delay: number) => {
      nextId += 1;

      const id = nextId;

      timers.set(id, { id, at: monotonic + Math.max(delay, 0), callback });

      return () => {
        timers.delete(id);
      };
    },
    random: () => random,
    advance: (milliseconds: number) => {
      const target = monotonic + milliseconds;

      let next = getNextDue(target);

      while (next !== null) {
        move(next.at - monotonic);
        run(next);
        next = getNextDue(target);
      }

      move(target - monotonic);
    },
    skip: move,
    runDue: () => {
      let next = getNextDue(monotonic);

      while (next !== null) {
        run(next);
        next = getNextDue(monotonic);
      }
    },
    setNow: (epochMilliseconds: number) => {
      wall = epochMilliseconds;
    },
    setRandom: (value: number) => {
      random = value;
    },
    pendingTimers: () => timers.size,
  });
};
