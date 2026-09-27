import { expect, test, vi } from "vitest";

import { ResourceScope } from "src/utils/internal/runtime/ResourceScope";

test("T037 cleanups run once, in reverse order", () => {
  const scope = new ResourceScope(() => {});
  const order: string[] = [];

  scope.add(() => order.push("first"));
  scope.add(() => order.push("second"));
  scope.dispose();
  scope.dispose();

  expect(order).toEqual(["second", "first"]);

  scope.add(() => order.push("late"));

  expect(order).toEqual(["second", "first", "late"]);
});

test("T158 a throwing cleanup is reported and the rest still run", () => {
  const report = vi.fn();
  const scope = new ResourceScope(report);
  const failure = new Error("cleanup");
  const after = vi.fn();

  scope.add(after);
  scope.add(() => {
    throw failure;
  });
  scope.dispose();

  expect(report).toHaveBeenCalledWith(failure);
  expect(after).toHaveBeenCalledTimes(1);
});

test("T038 a cleanup registered after the end runs at once", () => {
  const scope = new ResourceScope(() => {});
  const late = vi.fn();

  scope.dispose();
  scope.add(late);

  expect(late).toHaveBeenCalledTimes(1);
});
