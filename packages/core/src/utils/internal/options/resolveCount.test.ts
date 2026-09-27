import { expect, test } from "vitest";

import { resolveCount } from "src/utils/internal/options/resolveCount";

test("a left-out count is its default and a given one is kept", () => {
  expect(resolveCount("maxOutstandingChecks", undefined, 4)).toBe(4);
  expect(resolveCount("maxOutstandingChecks", 1, 4)).toBe(1);
});

test("a count that is not a positive whole number is refused", () => {
  for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(() => resolveCount("maxOutstandingChecks", value, 4)).toThrow(
      expect.objectContaining({
        code: "INVALID_CONFIGURATION",
        message: "maxOutstandingChecks must be a positive whole number.",
      }),
    );
  }
});
