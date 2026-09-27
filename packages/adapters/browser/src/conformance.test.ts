import { testNetworkAdapter } from "@priemskiyyy/reach/testing";
import { expect, test } from "vitest";

import { browser } from "src/browser";
import { createFakeWindow } from "src/fakeWindow.fixture";

test("the browser adapter keeps the adapter contract", async () => {
  const { passed } = await testNetworkAdapter(() => {
    const page = createFakeWindow({
      connection: { type: "wifi", saveData: false },
    });

    return {
      adapter: browser({ target: page.window }),
      change: () => page.changeConnection({ type: "cellular" }),
      settle: () => Promise.resolve(),
      subscriptionCount: page.listenerCount,
    };
  });

  expect(passed).toHaveLength(7);
});
