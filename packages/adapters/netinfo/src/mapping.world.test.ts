import { expect, test } from "vitest";

import type { NetInfoStateLike } from "src/types/NetInfoStateLike";
import { readNetInfoObservation } from "src/utils/readNetInfoObservation";

// Every state NetInfo can hand over, judged by NetInfo's own contract: only an explicit
// `none` that is not connected is no path, and a reachability of `false` says nothing.
test("no NetInfo state turns an ambiguous or negative report into offline, or a hint into more", () => {
  const types = [
    "none",
    "unknown",
    "wifi",
    "cellular",
    "vpn",
    "other",
    "bogus",
  ];

  const flags = [true, false, null];

  for (const platform of [true, false]) {
    for (const type of types) {
      for (const isConnected of flags) {
        for (const isInternetReachable of flags) {
          const state: NetInfoStateLike = {
            type,
            isConnected,
            isInternetReachable,
            details: platform ? { isConnectionExpensive: true } : null,
          };

          const { connection, internet, cost } = readNetInfoObservation(state, {
            metering: platform,
            internet: "reported",
          });

          const noPath = type === "none" && isConnected === false;
          const label = JSON.stringify(state);

          if (
            internet.status.status === "current" &&
            internet.status.value === "offline"
          ) {
            expect(noPath, label).toBe(true);
            expect(internet.status.basis, label).toBe("native-path");
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
            expect(type, label).not.toMatch(/^(none|unknown|bogus)$/);
          }

          if (
            internet.status.status === "current" &&
            internet.status.value === "online"
          ) {
            expect(isInternetReachable, label).toBe(true);
            expect(internet.status.basis, label).toBe("provider-report");
          }

          if (cost.metered.status === "current") {
            expect(platform, label).toBe(true);
            expect(cost.metered.basis, label).toBe("native-metering");
          }
        }
      }
    }
  }
});
