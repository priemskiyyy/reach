import { expect, test } from "vitest";

import * as api from "src/index";

test("the entry exports exactly the factory", () => {
  expect(Object.keys(api)).toEqual(["expoNetwork"]);
});
