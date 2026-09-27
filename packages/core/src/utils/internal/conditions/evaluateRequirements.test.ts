import { expect, test } from "vitest";

import { createObservation } from "src/mock/createObservation";
import { observed } from "src/mock/observed";
import type { ObservationInput } from "src/mock/types/ObservationInput";
import type { NetworkState } from "src/types/NetworkState";
import { evaluateRequirements } from "src/utils/internal/conditions/evaluateRequirements";
import { readObservation } from "src/utils/internal/evidence/readObservation";

const stateOf = (input: ObservationInput): NetworkState => ({
  revision: 1,
  generation: 1,
  ...readObservation(createObservation(input), 1_000),
});

test("T004 an unsupported fact leaves its requirement unknown", () => {
  const state = stateOf({ cost: { metered: { status: "unsupported" } } });

  expect(evaluateRequirements(state, { metered: false })).toEqual({
    status: "unknown",
    reasons: [{ code: "unsupported", field: "cost.metered", endpoint: null }],
  });
});

test("T005 an explicit unmetered report meets an unmetered requirement", () => {
  const state = stateOf({
    cost: { metered: observed(false, "native-metering") },
  });

  expect(evaluateRequirements(state, { metered: false }).status).toBe("met");
});

test("T006 an unknown expense never passes for inexpensive", () => {
  const state = stateOf({});

  expect(evaluateRequirements(state, { expensive: false })).toEqual({
    status: "unknown",
    reasons: [{ code: "unobserved", field: "cost.expensive", endpoint: null }],
  });
});

test("T009 a Wi-Fi connection without internet evidence meets connected but not online", () => {
  const state = stateOf({
    connection: {
      status: observed("connected", "native-path"),
      type: observed("wifi", "native-path"),
    },
  });

  expect(evaluateRequirements(state, { connection: "connected" }).status).toBe(
    "met",
  );
  expect(evaluateRequirements(state, { type: "wifi" }).status).toBe("met");
  expect(evaluateRequirements(state, { internet: "online" }).status).toBe(
    "unknown",
  );
});

test("T059 several requirements are one conjunction, a mismatch outweighs missing evidence", () => {
  const state = stateOf({
    internet: { status: { status: "unknown", reason: "source-ambiguous" } },
    cost: { metered: observed(true, "native-metering") },
  });

  expect(
    evaluateRequirements(state, { internet: "online", metered: false }),
  ).toEqual({
    status: "unmet",
    reasons: [{ code: "mismatch", field: "cost.metered", endpoint: null }],
  });

  expect(
    evaluateRequirements(state, { internet: "online", saveData: false }),
  ).toEqual({
    status: "unknown",
    reasons: [
      { code: "source-ambiguous", field: "internet.status", endpoint: null },
      { code: "unobserved", field: "preferences.saveData", endpoint: null },
    ],
  });
});

test("T012 an offline assessment makes an online requirement unmet", () => {
  const state = stateOf({
    internet: { status: observed("offline", "native-path") },
  });

  expect(evaluateRequirements(state, { internet: "online" }).status).toBe(
    "unmet",
  );
  expect(evaluateRequirements(state, { internet: "offline" }).status).toBe(
    "met",
  );
});
