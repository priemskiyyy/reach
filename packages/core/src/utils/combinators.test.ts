import { expect, test, vi } from "vitest";

import type { ConditionStatus } from "src/types/ConditionStatus";
import { all } from "src/utils/all";
import { any } from "src/utils/any";
import {
  createConditionSource,
  reasonFor,
  STATUSES,
} from "src/utils/conditions.fixture";
import { not } from "src/utils/not";

const ALL_TABLE: Record<
  ConditionStatus,
  Record<ConditionStatus, ConditionStatus>
> = {
  met: { met: "met", unmet: "unmet", unknown: "unknown" },
  unmet: { met: "unmet", unmet: "unmet", unknown: "unmet" },
  unknown: { met: "unknown", unmet: "unmet", unknown: "unknown" },
};

const ANY_TABLE: Record<
  ConditionStatus,
  Record<ConditionStatus, ConditionStatus>
> = {
  met: { met: "met", unmet: "met", unknown: "met" },
  unmet: { met: "met", unmet: "unmet", unknown: "unknown" },
  unknown: { met: "met", unmet: "unknown", unknown: "unknown" },
};

test("T056 all and any follow the strong three-valued truth table", () => {
  for (const first of STATUSES) {
    for (const second of STATUSES) {
      const a = createConditionSource(first, "a").condition;
      const b = createConditionSource(second, "b").condition;

      expect(all(a, b).get().status).toBe(ALL_TABLE[first][second]);
      expect(any(a, b).get().status).toBe(ANY_TABLE[first][second]);
    }
  }
});

test("T056 not swaps met and unmet and keeps unknown", () => {
  const met = createConditionSource("met").condition;
  const unmet = createConditionSource("unmet").condition;
  const unknown = createConditionSource("unknown", "unsupported").condition;

  expect(not(met).get()).toEqual({
    status: "unmet",
    reasons: [reasonFor("negated")],
  });
  expect(not(unmet).get()).toEqual({ status: "met", reasons: [] });
  expect(not(unknown).get()).toBe(unknown.get());
});

test("all answers the reasons of the inputs that decided it, in order, once each", () => {
  const first = createConditionSource("unknown", "stale").condition;
  const second = createConditionSource("unmet", "mismatch").condition;
  const third = createConditionSource("unknown", "unsupported").condition;
  const fourth = createConditionSource("unknown", "stale").condition;

  expect(all(first, third, fourth).get()).toEqual({
    status: "unknown",
    reasons: [reasonFor("stale"), reasonFor("unsupported")],
  });
  expect(all(first, second, third).get()).toEqual({
    status: "unmet",
    reasons: [reasonFor("mismatch")],
  });
});

test("any answers the unknown inputs' reasons, or every reason when all are unmet", () => {
  const first = createConditionSource("unmet", "mismatch").condition;
  const second = createConditionSource("unknown", "stale").condition;

  const third = createConditionSource(
    "unmet",
    "endpoint-unavailable",
  ).condition;

  expect(any(first, second).get().reasons).toEqual([reasonFor("stale")]);
  expect(any(first, third).get().reasons).toEqual([
    reasonFor("mismatch"),
    reasonFor("endpoint-unavailable"),
  ]);
});

test("a composed condition keeps its state's identity and notifies only a change", () => {
  const first = createConditionSource("met");
  const second = createConditionSource("unknown", "stale");
  const both = all(first.condition, second.condition);
  const listener = vi.fn();
  const initial = both.get();

  both.subscribe(listener);
  first.set("met");
  second.set("unknown", "stale");

  expect(both.get()).toBe(initial);
  expect(listener).not.toHaveBeenCalled();

  second.set("unknown", "unsupported");
  expect(listener).toHaveBeenCalledTimes(1);

  second.set("met");
  expect(listener).toHaveBeenCalledTimes(2);
  expect(both.get().status).toBe("met");
});

test("the same condition given twice is evaluated as one input", () => {
  const source = createConditionSource("unknown", "stale");

  expect(all(source.condition, source.condition).get().reasons).toEqual([
    reasonFor("stale"),
  ]);
});
