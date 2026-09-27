import { Reach } from "@priemskiyyy/reach";
import { createTestClock } from "@priemskiyyy/reach/mock";
import { expect, test } from "vitest";

import {
  CELLULAR_STATE,
  createFakeNetInfo,
  WIFI_STATE,
} from "src/fakeNetInfo.fixture";
import { netInfo } from "src/netInfo";
import type { NetInfoAdapterOptions } from "src/types/NetInfoAdapterOptions";
import type { NetInfoStateLike } from "src/types/NetInfoStateLike";

const flush = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const startNetInfo = async (
  state: NetInfoStateLike,
  options: Partial<Omit<NetInfoAdapterOptions, "sdk">> = {},
) => {
  const fake = createFakeNetInfo(state);

  const reach = new Reach({
    adapter: netInfo({ sdk: fake.sdk, platform: "android", ...options }),
    clock: createTestClock(),
  });

  await reach.start().ready;
  await flush();

  return { reach, fake };
};

test("T032 NetInfo on the web is refused, never mapped through its web module", async () => {
  const fake = createFakeNetInfo();

  const reach = new Reach({
    adapter: netInfo({ sdk: fake.sdk, platform: "web" }),
    clock: createTestClock(),
  });

  await expect(reach.start().ready).rejects.toMatchObject({
    cause: expect.objectContaining({ code: "UNSUPPORTED_ENVIRONMENT" }),
  });
  expect(fake.listenerCount()).toBe(0);
});

test("a connected, reachable Wi-Fi report on Android", async () => {
  const { reach } = await startNetInfo(WIFI_STATE);

  expect(reach.state.get()).toMatchObject({
    connection: { status: "connected", type: "wifi", transports: null },
    internet: { status: "online" },
    cost: { metered: false, expensive: null },
  });
  expect(reach.state.get().evidence["internet.status"].basis).toBe(
    "provider-report",
  );
  expect(reach.state.get().evidence["cost.metered"].basis).toBe(
    "native-metering",
  );
});

test("T024 false reachability while connected stays unknown", async () => {
  const { reach } = await startNetInfo({
    ...WIFI_STATE,
    isInternetReachable: false,
  });

  expect(reach.state.get().internet.status).toBe("unknown");
  expect(reach.state.get().evidence["internet.status"].reason).toBe(
    "source-ambiguous",
  );
  expect(reach.condition({ internet: "online" }).get().status).toBe("unknown");
});

test("T003 an unknown type with false connectivity is unknown, not offline", async () => {
  const { reach } = await startNetInfo({
    type: "unknown",
    isConnected: false,
    isInternetReachable: null,
    details: null,
  });

  expect(reach.state.get()).toMatchObject({
    connection: { status: "unknown", type: "unknown" },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"].reason).toBe(
    "source-ambiguous",
  );
});

test("T012 an explicit none is a native report of no path", async () => {
  const { reach } = await startNetInfo({
    type: "none",
    isConnected: false,
    isInternetReachable: false,
    details: null,
  });

  expect(reach.state.get()).toMatchObject({
    connection: { status: "disconnected", type: "none" },
    internet: { status: "offline" },
    cost: { metered: null },
  });
  expect(reach.state.get().evidence["internet.status"].basis).toBe(
    "native-path",
  );
});

test("T012 a none type without a disconnected report is no evidence of no path", async () => {
  const { reach } = await startNetInfo({
    type: "none",
    isConnected: null,
    isInternetReachable: null,
    details: null,
  });

  expect(reach.state.get()).toMatchObject({
    connection: { status: "unknown", type: "none" },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"].reason).toBe(
    "source-ambiguous",
  );
});

test("a missing reachability is unknown", async () => {
  const { reach } = await startNetInfo({
    ...WIFI_STATE,
    isInternetReachable: null,
  });

  expect(reach.state.get().internet.status).toBe("unknown");
});

test("T022 T030 Android's metering answer is metering with partial coverage, and expense stays unsupported", async () => {
  const { reach } = await startNetInfo(CELLULAR_STATE);

  expect(reach.state.get().cost).toEqual({ metered: true, expensive: null });
  expect(reach.capabilities.get()?.["cost.metered"]).toEqual({
    support: "supported",
    notifications: "partial",
    bases: ["native-metering"],
  });
});

test("T023 iOS's transport-derived expense is neither metering nor expense", async () => {
  const { reach } = await startNetInfo(CELLULAR_STATE, { platform: "ios" });

  expect(reach.state.get().cost).toEqual({ metered: null, expensive: null });
  expect(reach.capabilities.get()?.["cost.metered"].support).toBe(
    "unsupported",
  );
  expect(reach.condition({ metered: false }).get().status).toBe("unknown");
});

test("T025 ignoring NetInfo's reachability leaves internet unsupported", async () => {
  const { reach } = await startNetInfo(WIFI_STATE, { internet: "ignore" });

  expect(reach.state.get().internet.status).toBe("unknown");
  expect(reach.state.get().evidence["internet.status"].status).toBe(
    "unsupported",
  );
});

test("T041 an event that arrives before the first read wins over it", async () => {
  const fake = createFakeNetInfo(WIFI_STATE);

  fake.behavior.holdFetch = true;
  fake.behavior.announceOnSubscribe = false;

  const reach = new Reach({
    adapter: netInfo({ sdk: fake.sdk, platform: "android" }),
    clock: createTestClock(),
  });

  await reach.start().ready;
  fake.emit(CELLULAR_STATE);
  fake.resolveFetch(WIFI_STATE);
  await flush();

  expect(reach.state.get().connection.type).toBe("cellular");
});

test("a refresh asks NetInfo to refresh and reports what it answers", async () => {
  const { reach, fake } = await startNetInfo(WIFI_STATE);

  await expect(reach.refresh()).resolves.toMatchObject({
    status: "unchanged",
  });
  expect(fake.calls.refresh).toBe(1);
});

test("T031 NetInfo is borrowed: never configured, and only the adapter's own listener is removed", async () => {
  const fake = createFakeNetInfo(WIFI_STATE);

  fake.sdk.addEventListener(() => {});

  const reach = new Reach({
    adapter: netInfo({ sdk: fake.sdk, platform: "android" }),
    clock: createTestClock(),
  });

  const lease = reach.start();

  await lease.ready;

  expect(reach.native.get()).toBe(fake.sdk);
  expect(fake.listenerCount()).toBe(2);

  lease.release();

  expect(fake.listenerCount()).toBe(1);
  expect(fake.calls.configure).toBe(0);
  expect(reach.capabilities.get()).toBeNull();
});
