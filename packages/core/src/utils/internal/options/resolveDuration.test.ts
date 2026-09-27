import { expect, test } from "vitest";

import { resolveDuration } from "src/utils/internal/options/resolveDuration";

test("a left-out duration is its default and a given one is kept", () => {
  expect(resolveDuration("timeout", undefined, 5_000)).toBe(5_000);
  expect(resolveDuration("timeout", 250, 5_000)).toBe(250);
});

test("T090 a duration that is not a positive whole number is refused", () => {
  for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(() => resolveDuration("staleAfter", value, 1)).toThrow(
      expect.objectContaining({
        code: "INVALID_CONFIGURATION",
        message: "staleAfter must be a positive whole number of milliseconds.",
      }),
    );
  }
});
