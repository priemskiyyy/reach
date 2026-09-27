import { expect, test, vi } from "vitest";

import { createTestClock } from "src/mock/createTestClock";
import { DeadlineScheduler } from "src/utils/internal/scheduling/DeadlineScheduler";

test("T089 many deadlines share one armed timer and run in order", () => {
  const clock = createTestClock();
  const scheduler = new DeadlineScheduler(clock);
  const log: string[] = [];

  scheduler.schedule(300, () => log.push("third"));
  scheduler.schedule(100, () => log.push("first"));
  scheduler.schedule(100, () => log.push("second"));

  expect(clock.pendingTimers()).toBe(1);

  clock.advance(300);

  expect(log).toEqual(["first", "second", "third"]);
  expect(clock.pendingTimers()).toBe(0);
});

test("a cancelled deadline never runs and releases its timer", () => {
  const clock = createTestClock();
  const scheduler = new DeadlineScheduler(clock);
  const log: string[] = [];
  const cancel = scheduler.schedule(100, () => log.push("cancelled"));

  cancel();
  cancel();
  clock.advance(100);

  expect(log).toEqual([]);
  expect(clock.pendingTimers()).toBe(0);
});

test("T092 a suspended runtime runs each overdue deadline once when it wakes", () => {
  const clock = createTestClock();
  const scheduler = new DeadlineScheduler(clock);
  const log: number[] = [];

  scheduler.schedule(100, () => log.push(clock.monotonic()));
  clock.skip(60_000);
  clock.runDue();

  expect(log).toEqual([60_000]);
});

test("T090 a wait longer than the host timer holds is armed again in segments", () => {
  const clock = createTestClock();
  const log: string[] = [];

  // A host that caps every delay at 400 milliseconds fires long waits early.
  const scheduler = new DeadlineScheduler({
    ...clock,
    setTimer: (callback, delay) =>
      clock.setTimer(callback, Math.min(delay, 400)),
  });

  scheduler.schedule(1_000, () => log.push("due"));
  clock.advance(999);

  expect(log).toEqual([]);

  clock.advance(1);
  expect(log).toEqual(["due"]);
});

test("a deadline that throws is reported, and the ones after it still run", () => {
  const reported: unknown[] = [];

  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((task) => {
    try {
      task();
    } catch (error) {
      reported.push(error);
    }
  });

  const clock = createTestClock();
  const scheduler = new DeadlineScheduler(clock);
  const failure = new Error("deadline");
  const log: string[] = [];

  scheduler.schedule(100, () => {
    throw failure;
  });
  scheduler.schedule(100, () => log.push("same wake"));
  scheduler.schedule(200, () => log.push("next wake"));

  clock.advance(200);

  expect(log).toEqual(["same wake", "next wake"]);
  expect(reported).toEqual([failure]);
});
