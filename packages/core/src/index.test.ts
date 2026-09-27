import { expect, test } from "vitest";

import * as api from "src/index";
import * as mock from "src/mock";

test("every entry exports exactly its public runtime names", () => {
  expect(Object.keys(api).sort()).toEqual([
    "Reach",
    "ReachError",
    "UNKNOWN_NETWORK_STATE",
    "all",
    "any",
    "createCondition",
    "not",
  ]);
  expect(Object.keys(mock).sort()).toEqual([
    "createMockNetwork",
    "createObservation",
    "createTestClock",
    "observed",
  ]);
});
