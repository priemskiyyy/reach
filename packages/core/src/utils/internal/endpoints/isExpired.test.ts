import { expect, test } from "vitest";

import { createTestClock } from "src/mock/createTestClock";
import { isExpired } from "src/utils/internal/endpoints/isExpired";

const STALE_AFTER = 30_000;

test("T081 a result expires once its freshness has elapsed", () => {
  const clock = createTestClock({ now: 1_000 });
  const completion = { monotonic: clock.monotonic(), wall: clock.now() };

  clock.advance(29_999);
  expect(isExpired(completion, STALE_AFTER, clock)).toBe(false);

  clock.advance(1);
  expect(isExpired(completion, STALE_AFTER, clock)).toBe(true);
});

test("T085 epoch time moving back ends a result instead of extending it", () => {
  const clock = createTestClock({ now: 100_000 });
  const completion = { monotonic: clock.monotonic(), wall: clock.now() };

  clock.setNow(50_000);

  expect(isExpired(completion, STALE_AFTER, clock)).toBe(true);
});

test("T086 a sleep that paused the monotonic clock still expires the result", () => {
  const clock = createTestClock({ now: 100_000 });
  const completion = { monotonic: clock.monotonic(), wall: clock.now() };

  clock.setNow(160_000);

  expect(isExpired(completion, STALE_AFTER, clock)).toBe(true);
});

test("T087 a forward correction may expire early but never extends", () => {
  const clock = createTestClock({ now: 100_000 });
  const completion = { monotonic: clock.monotonic(), wall: clock.now() };

  clock.setNow(105_000);

  expect(isExpired(completion, STALE_AFTER, clock)).toBe(true);
});

test("rounding jitter between the clocks is tolerated", () => {
  const clock = createTestClock({ now: 100_000 });
  const completion = { monotonic: clock.monotonic(), wall: clock.now() };

  clock.advance(5_000);
  clock.setNow(clock.now() + 500);

  expect(isExpired(completion, STALE_AFTER, clock)).toBe(false);
});
