import { expect, test } from "vitest";

import { createObservation } from "src/mock/createObservation";
import { observed } from "src/mock/observed";
import type { ObservationInput } from "src/mock/types/ObservationInput";
import { isConnectionChange } from "src/utils/internal/evidence/isConnectionChange";
import { readObservation } from "src/utils/internal/evidence/readObservation";

const factsOf = (input: ObservationInput) =>
  readObservation(createObservation(input), 0);

const WIFI = factsOf({
  connection: { status: observed("connected"), type: observed("wifi") },
  cost: { metered: observed(false) },
});

test("a change of connection status or type is a connection change", () => {
  const cellular = factsOf({
    connection: { status: observed("connected"), type: observed("cellular") },
  });

  const disconnected = factsOf({
    connection: { status: observed("disconnected"), type: observed("wifi") },
  });

  expect(isConnectionChange(WIFI, cellular)).toBe(true);
  expect(isConnectionChange(WIFI, disconnected)).toBe(true);
});

test("cost and preference changes are not connection changes", () => {
  const metered = factsOf({
    connection: { status: observed("connected"), type: observed("wifi") },
    cost: { metered: observed(true) },
    preferences: { saveData: observed(true) },
  });

  expect(isConnectionChange(WIFI, metered)).toBe(false);
});
