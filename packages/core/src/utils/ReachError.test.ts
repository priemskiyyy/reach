import { expect, test } from "vitest";

import { ReachError } from "src/utils/ReachError";

test("a reach error keeps its code, message and cause", () => {
  const cause = new Error("The provider threw.");

  const error = new ReachError({
    code: "SOURCE_ERROR",
    message: "The adapter failed to open.",
    cause,
  });

  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe("ReachError");
  expect(error.code).toBe("SOURCE_ERROR");
  expect(error.message).toBe("The adapter failed to open.");
  expect(error.cause).toBe(cause);
});

test("a reach error without a cause has no cause of its own", () => {
  const error = new ReachError({ code: "DISPOSED", message: "Disposed." });

  expect(Object.hasOwn(error, "cause")).toBe(false);
});
