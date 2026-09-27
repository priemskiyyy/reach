import { Reach } from "@priemskiyyy/reach";
import { testNetworkAdapter } from "@priemskiyyy/reach/testing";
import { afterEach, expect, test, vi } from "vitest";

import { JOIN_DELAY } from "example-shared/phone/constants/phone";
import { createSimulatedPhone } from "example-shared/phone/createSimulatedPhone";

const reaches: Reach<unknown>[] = [];

afterEach(() => {
  for (const reach of reaches.splice(0)) {
    reach.dispose();
  }

  vi.useRealTimers();
});

const startPhone = async () => {
  const phone = createSimulatedPhone();
  const reach = new Reach({ adapter: phone.adapter });

  reaches.push(reach);
  await reach.start().ready;

  return { phone, reach };
};

test("the simulated phone passes the adapter conformance suite", async () => {
  const { passed } = await testNetworkAdapter(() => {
    const phone = createSimulatedPhone();

    return {
      adapter: phone.adapter,
      change: () => {
        phone.setLink(phone.state.get().link === "wifi" ? "cellular" : "wifi");
      },
      settle: () => Promise.resolve(),
      subscriptionCount: phone.sessionCount,
    };
  });

  expect(passed).toHaveLength(7);
});

test("on home Wi-Fi every fact is current, and the internet rests on the phone's validation", async () => {
  const { reach } = await startPhone();

  expect(reach.state.get()).toMatchObject({
    connection: { status: "connected", type: "wifi", transports: ["wifi"] },
    internet: { status: "online" },
    cost: { metered: false, expensive: false },
    preferences: { constrained: false, saveData: null },
  });
  expect(reach.state.get().evidence).toMatchObject({
    "internet.status": { status: "current", basis: "native-validation" },
    "preferences.saveData": { status: "unsupported", reason: "unsupported" },
  });
  expect(reach.native.get()).toEqual({ model: "Darkroom test phone" });
});

test("behind a sign-in page the internet is unknown for an ambiguous source, never offline", async () => {
  const { phone, reach } = await startPhone();

  vi.useFakeTimers();
  phone.setLink("portal");
  vi.advanceTimersByTime(JOIN_DELAY);

  expect(reach.state.get()).toMatchObject({
    connection: { status: "connected", type: "wifi" },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["internet.status"]).toMatchObject({
    status: "unknown",
    reason: "source-ambiguous",
  });
});

test("cellular is metered, and so is a hotspot joined from it at once", async () => {
  const { phone, reach } = await startPhone();

  phone.setLink("cellular");

  expect(reach.state.get()).toMatchObject({
    connection: { type: "cellular", transports: ["cellular"] },
    cost: { metered: true, expensive: true },
  });

  phone.setLink("hotspot");

  expect(phone.state.get().joining).toBe(false);
  expect(reach.state.get()).toMatchObject({
    connection: { type: "wifi" },
    cost: { metered: true, expensive: true },
  });
});

test("without a signal the phone is offline on its own path, and its cost is unknown", async () => {
  const { phone, reach } = await startPhone();

  phone.setLink("none");

  expect(reach.state.get()).toMatchObject({
    connection: { status: "disconnected", type: "none", transports: [] },
    internet: { status: "offline" },
    cost: { metered: null, expensive: null },
  });
  expect(reach.state.get().evidence["cost.metered"]).toMatchObject({
    status: "unknown",
    reason: "disconnected",
  });
});

test("Low Data Mode is the user's own preference", async () => {
  const { phone, reach } = await startPhone();

  phone.setLowDataMode(true);

  expect(reach.state.get().preferences.constrained).toBe(true);
  expect(reach.state.get().evidence["preferences.constrained"]).toMatchObject({
    status: "current",
    basis: "user-data-preference",
  });
});

test("a failing service turns every fact into an error, and its next report recovers them", async () => {
  const { phone, reach } = await startPhone();

  phone.setFailing(true);

  expect(reach.state.get().connection.status).toBe("unknown");
  expect(reach.state.get().evidence["connection.status"]).toMatchObject({
    status: "error",
  });

  phone.setFailing(false);

  expect(reach.state.get().connection.status).toBe("connected");
  expect(reach.state.get().evidence["connection.status"]).toMatchObject({
    status: "current",
  });
});

test("joining another Wi-Fi makes every fact stale in a new generation until the phone reports the new one", async () => {
  const { phone, reach } = await startPhone();
  const { generation } = reach.state.get();

  vi.useFakeTimers();
  phone.setLink("hotspot");

  expect(phone.state.get().joining).toBe(true);
  expect(reach.state.get().generation).toBe(generation + 1);
  expect(reach.state.get().evidence["connection.type"]).toMatchObject({
    status: "stale",
    reason: "observation-gap",
  });

  vi.advanceTimersByTime(JOIN_DELAY);

  expect(phone.state.get().joining).toBe(false);
  expect(reach.state.get()).toMatchObject({
    connection: { type: "wifi" },
    cost: { metered: true },
  });
  expect(reach.state.get().evidence["connection.type"]).toMatchObject({
    status: "current",
  });
});
