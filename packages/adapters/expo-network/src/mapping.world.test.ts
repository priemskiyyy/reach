import { expect, test } from "vitest";

import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";
import { readExpoObservation } from "src/utils/readExpoObservation";

// Every state Expo Network can hand over, judged by Expo's contract as documented in the
// adapter: Android answers NONE with no active network, and iOS's one-shot read answers
// the same tuple when its monitor times out, so only a live iOS event is trusted with it.
test("no Expo state turns an ambiguous or negative report into offline, or iOS into online", () => {
  const types = [
    undefined,
    "NONE",
    "UNKNOWN",
    "WIFI",
    "CELLULAR",
    "VPN",
    "OTHER",
  ];

  const flags = [true, false, undefined];
  const platforms: Array<"ios" | "android"> = ["ios", "android"];
  const reports: Array<"event" | "read"> = ["event", "read"];

  for (const platform of platforms) {
    for (const report of reports) {
      for (const type of types) {
        for (const isConnected of flags) {
          for (const isInternetReachable of flags) {
            const state: ExpoNetworkStateLike = {
              ...(type === undefined ? {} : { type }),
              ...(isConnected === undefined ? {} : { isConnected }),
              ...(isInternetReachable === undefined
                ? {}
                : { isInternetReachable }),
            };

            const { connection, internet } = readExpoObservation(
              state,
              platform,
              report,
            );

            const trusted = platform === "android" || report === "event";
            const noPath = trusted && type === "NONE" && isConnected === false;
            const label = `${platform} ${report} ${JSON.stringify(state)}`;

            if (
              internet.status.status === "current" &&
              internet.status.value === "offline"
            ) {
              expect(noPath, label).toBe(true);
            }

            if (
              connection.status.status === "current" &&
              connection.status.value === "disconnected"
            ) {
              expect(noPath, label).toBe(true);
            }

            if (
              connection.status.status === "current" &&
              connection.status.value === "connected"
            ) {
              expect(isConnected, label).toBe(true);
            }

            if (
              internet.status.status === "current" &&
              internet.status.value === "online"
            ) {
              expect(platform, label).toBe("android");
              expect(isConnected, label).toBe(true);
              expect(isInternetReachable, label).toBe(true);
              expect(internet.status.basis, label).toBe("native-validation");
            }
          }
        }
      }
    }
  }
});
