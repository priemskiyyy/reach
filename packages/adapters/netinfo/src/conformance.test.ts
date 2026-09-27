import { testNetworkAdapter } from "@priemskiyyy/reach/testing";
import { expect, test } from "vitest";

import {
  CELLULAR_STATE,
  createFakeNetInfo,
  WIFI_STATE,
} from "src/fakeNetInfo.fixture";
import { netInfo } from "src/netInfo";

test("the netinfo adapter keeps the adapter contract on both platforms", async () => {
  for (const platform of ["ios", "android"]) {
    const { passed } = await testNetworkAdapter(() => {
      const fake = createFakeNetInfo(WIFI_STATE);

      return {
        adapter: netInfo({ sdk: fake.sdk, platform }),
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
