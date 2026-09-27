import { expect, test } from "vitest";

import * as api from "src/index";

test("the entry exports exactly the bridge", () => {
  expect(Object.keys(api)).toEqual(["toOnlineEventListener"]);
});
