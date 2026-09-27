import { UNKNOWN_NETWORK_STATE } from "@priemskiyyy/reach";
import type { NetworkState } from "@priemskiyyy/reach";
import { expect, test } from "vitest";

import { FIELD_ORDER } from "example-shared/darkroom/network/constants/labels";
import { formatFactValue } from "example-shared/formatting/formatFactValue";

const read = (state: NetworkState) =>
  FIELD_ORDER.map((field) => formatFactValue(state, field));

test("before anything is reported every fact is unknown, never no or offline", () => {
  expect(read(UNKNOWN_NETWORK_STATE)).toEqual([
    "Unknown",
    "Unknown",
    "Unknown",
    "Unknown",
    "Unknown",
    "Unknown",
    "Unknown",
    "Unknown",
  ]);
});

test("reported facts read in words, and an empty set of transports is none", () => {
  const state: NetworkState = {
    ...UNKNOWN_NETWORK_STATE,
    connection: { status: "connected", type: "wifi", transports: [] },
    internet: { status: "online" },
    cost: { metered: true, expensive: false },
    preferences: { constrained: false, saveData: null },
  };

  expect(read(state)).toEqual([
    "Connected",
    "Wi-Fi",
    "None",
    "Online",
    "Yes",
    "No",
    "No",
    "Unknown",
  ]);
  expect(
    formatFactValue(
      {
        ...state,
        connection: {
          status: "connected",
          type: "mixed",
          transports: ["wifi", "vpn"],
        },
      },
      "connection.transports",
    ),
  ).toBe("Wi-Fi, VPN");
});
