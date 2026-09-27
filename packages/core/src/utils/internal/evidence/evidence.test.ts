import { expect, test } from "vitest";

import { createObservation } from "src/mock/createObservation";
import { observed } from "src/mock/observed";
import {
  NETWORK_FIELDS,
  UNKNOWN_NETWORK_STATE,
} from "src/utils/constants/network";
import { getFailedFacts } from "src/utils/internal/evidence/getFailedFacts";
import { getStaleFacts } from "src/utils/internal/evidence/getStaleFacts";
import { isSameFacts } from "src/utils/internal/evidence/isSameFacts";
import { readObservation } from "src/utils/internal/evidence/readObservation";

test("T001 the unknown state is deterministic and frozen", () => {
  expect(UNKNOWN_NETWORK_STATE).toMatchObject({
    revision: 0,
    generation: 0,
    connection: { status: "unknown", type: "unknown", transports: null },
    internet: { status: "unknown" },
    cost: { metered: null, expensive: null },
    preferences: { constrained: null, saveData: null },
  });
  expect(Object.isFrozen(UNKNOWN_NETWORK_STATE.evidence)).toBe(true);
  expect(Object.keys(UNKNOWN_NETWORK_STATE.evidence)).toEqual(NETWORK_FIELDS);
});

test("a current report carries its value, basis and receipt, but no invented verification", () => {
  const facts = readObservation(
    createObservation({
      connection: { status: observed("connected", "native-path") },
    }),
    1_000,
  );

  expect(facts.connection.status).toBe("connected");
  expect(facts.evidence["connection.status"]).toEqual({
    status: "current",
    basis: "native-path",
    receivedAt: 1_000,
    verifiedAt: null,
    reason: null,
  });
});

test("T004 an unsupported fact is null with unsupported evidence, never false", () => {
  const facts = readObservation(
    createObservation({ cost: { metered: { status: "unsupported" } } }),
    1_000,
  );

  expect(facts.cost.metered).toBeNull();
  expect(facts.evidence["cost.metered"]).toMatchObject({
    status: "unsupported",
    reason: "unsupported",
  });
});

test("T005 an explicit false keeps its basis", () => {
  const facts = readObservation(
    createObservation({
      cost: { metered: observed(false, "native-metering") },
    }),
    1_000,
  );

  expect(facts.cost.metered).toBe(false);
  expect(facts.evidence["cost.metered"].basis).toBe("native-metering");
});

test("T007 T008 cost and data preferences stay separate facts", () => {
  const facts = readObservation(
    createObservation({
      cost: { metered: observed(true, "native-metering") },
      preferences: {
        constrained: observed(true, "user-data-preference"),
        saveData: observed(false, "user-data-preference"),
      },
    }),
    1_000,
  );

  expect(facts.cost).toEqual({ metered: true, expensive: null });
  expect(facts.preferences).toEqual({ constrained: true, saveData: false });
});

test("an unknown or failed report keeps the adapter's reason", () => {
  const facts = readObservation(
    createObservation({
      internet: { status: { status: "unknown", reason: "source-ambiguous" } },
      cost: { expensive: { status: "error" } },
    }),
    1_000,
  );

  expect(facts.internet.status).toBe("unknown");
  expect(facts.evidence["internet.status"].reason).toBe("source-ambiguous");
  expect(facts.evidence["cost.expensive"]).toMatchObject({
    status: "error",
    reason: "source-error",
  });
});

test("T028 T029 a reported transport set is copied, and a missing one stays null", () => {
  const transports = ["wifi", "vpn"] satisfies ["wifi", "vpn"];

  const facts = readObservation(
    createObservation({
      connection: { transports: observed([...transports]) },
    }),
    1_000,
  );

  const without = readObservation(createObservation(), 1_000);

  expect(facts.connection.transports).toEqual(["wifi", "vpn"]);
  expect(Object.isFrozen(facts.connection.transports)).toBe(true);
  expect(without.connection.transports).toBeNull();
});

test("T013 T014 receipt time alone is not a change, a different basis is", () => {
  const first = readObservation(
    createObservation({
      connection: { status: observed("connected", "browser-hint") },
    }),
    1_000,
  );

  const repeated = readObservation(
    createObservation({
      connection: { status: observed("connected", "browser-hint") },
    }),
    2_000,
  );

  const rebased = readObservation(
    createObservation({
      connection: { status: observed("connected", "native-path") },
    }),
    2_000,
  );

  expect(isSameFacts(first, repeated)).toBe(true);
  expect(isSameFacts(first, rebased)).toBe(false);
});

test("stale facts drop every value and keep the history of current evidence", () => {
  const facts = readObservation(
    createObservation({
      connection: { status: observed("connected", "native-path") },
      cost: { expensive: { status: "unsupported" } },
    }),
    1_000,
  );

  const stale = getStaleFacts(facts, "runtime-idle");

  expect(stale.connection.status).toBe("unknown");
  expect(stale.evidence["connection.status"]).toEqual({
    status: "stale",
    basis: "native-path",
    receivedAt: 1_000,
    verifiedAt: null,
    reason: "runtime-idle",
  });
  expect(stale.evidence["cost.expensive"].status).toBe("unsupported");
});

test("failed facts turn every observable fact into an error, never offline", () => {
  const facts = readObservation(
    createObservation({
      internet: { status: observed("online", "native-validation") },
      cost: { expensive: { status: "unsupported" } },
    }),
    1_000,
  );

  const failed = getFailedFacts(facts, "source-error");

  expect(failed.internet.status).toBe("unknown");
  expect(failed.evidence["internet.status"]).toMatchObject({
    status: "error",
    reason: "source-error",
  });
  expect(failed.evidence["connection.type"].status).toBe("error");
  expect(failed.evidence["cost.expensive"].status).toBe("unsupported");
});
