import { testNetworkAdapter } from "@priemskiyyy/reach/testing";
import { expect, test } from "vitest";

import { expoNetwork } from "src/expoNetwork";
import {
  CELLULAR_STATE,
  createFakeExpoNetwork,
  WIFI_STATE,
} from "src/fakeExpoNetwork.fixture";

test("the expo network adapter keeps the adapter contract on both platforms", async () => {
  for (const platform of ["ios", "android"]) {
    const { passed } = await testNetworkAdapter(() => {
      const fake = createFakeExpoNetwork(WIFI_STATE);

      return {
        adapter: expoNetwork({ sdk: fake.sdk, platform }),
        change: () => fake.emit(CELLULAR_STATE),
        settle: () =>
          new Promise<void>((resolve) => {
            setTimeout(resolve, 0);
          }),
        subscriptionCount: fake.listenerCount,
      };
    });

    expect(passed).toHaveLength(7);
  }
});
