import { expect, test } from "vitest";

import { createObservation } from "src/mock/createObservation";
import { observed } from "src/mock/observed";
import type { ObservationInput } from "src/mock/types/ObservationInput";
import { isRouteChange } from "src/utils/internal/evidence/isRouteChange";
import { readObservation } from "src/utils/internal/evidence/readObservation";

const factsOf = (input: ObservationInput) =>
  readObservation(createObservation(input), 0);

const WIFI = factsOf({
  connection: { status: observed("connected"), type: observed("wifi") },
  cost: { metered: observed(false) },
});

test("a change of connection status or type is a route change", () => {
  const cellular = factsOf({
    connection: { status: observed("connected"), type: observed("cellular") },
  });

  const disconnected = factsOf({
    connection: { status: observed("disconnected"), type: observed("wifi") },
  });

  expect(isRouteChange(WIFI, cellular, undefined, null)).toBe(true);
  expect(isRouteChange(WIFI, disconnected, undefined, null)).toBe(true);
});

test("cost and preference changes are not route changes", () => {
  const metered = factsOf({
    connection: { status: observed("connected"), type: observed("wifi") },
    cost: { metered: observed(true) },
    preferences: { saveData: observed(true) },
  });

  expect(isRouteChange(WIFI, metered, undefined, null)).toBe(false);
});

test("the source can mark a route change the coarse facts cannot show", () => {
  expect(isRouteChange(WIFI, WIFI, { changed: true }, null)).toBe(true);
  expect(isRouteChange(WIFI, WIFI, { key: "b" }, "a")).toBe(true);
  expect(isRouteChange(WIFI, WIFI, { key: "a" }, "a")).toBe(false);
  expect(isRouteChange(WIFI, WIFI, { key: "a" }, null)).toBe(false);
});
