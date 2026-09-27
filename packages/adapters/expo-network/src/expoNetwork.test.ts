import { Reach } from "@priemskiyyy/reach";
import { createTestClock } from "@priemskiyyy/reach/mock";
import { expect, test } from "vitest";

import { expoNetwork } from "src/expoNetwork";
import {
  CELLULAR_STATE,
  createFakeExpoNetwork,
  FAILED_READ_STATE,
  NO_PATH_STATE,
  WIFI_STATE,
} from "src/fakeExpoNetwork.fixture";
import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";
import type { ExpoPlatform } from "src/types/internal/ExpoPlatform";

const PLATFORMS: ExpoPlatform[] = ["ios", "android"];

const flush = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const startExpoNetwork = async (
  state: ExpoNetworkStateLike,
  platform: ExpoPlatform,
) => {
  const fake = createFakeExpoNetwork(state);

  const reach = new Reach({
    adapter: expoNetwork({ sdk: fake.sdk, platform }),
    clock: createTestClock(),
  });

  await reach.start().ready;
  await flush();

  return { reach, fake };
};

test("T032 Expo Network on the web is unavailable, never mapped through its web module", async () => {
  const fake = createFakeExpoNetwork();

  const reach = new Reach({
    adapter: expoNetwork({ sdk: fake.sdk, platform: "web" }),
    clock: createTestClock(),
  });

  await expect(reach.start().ready).resolves.toBeUndefined();
  expect(fake.listenerCount()).toBe(0);
  expect(fake.calls.reads).toBe(0);
  expect(reach.state.get().evidence["internet.status"].reason).toBe(
    "source-unavailable",
  );
});

test("T026 a satisfied iOS path is connected, and the internet stays unknown", async () => {
  const { reach } = await startExpoNetwork(WIFI_STATE, "ios");

  expect(reach.state.get()).toMatchObject({
    connection: { status: "connected", type: "wifi", transports: null },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["internet.status"]).toMatchObject({
    status: "unknown",
    reason: "unobserved",
  });
  expect(reach.condition({ internet: "online" }).get().status).toBe("unknown");
});

test("T026 a negative iOS read stays unknown, since a timed-out read answers the same", async () => {
  const { reach } = await startExpoNetwork(NO_PATH_STATE, "ios");

  expect(reach.state.get()).toMatchObject({
    connection: { status: "unknown", type: "unknown" },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"].reason).toBe(
    "source-ambiguous",
  );
  expect(reach.condition({ connection: "connected" }).get().status).toBe(
    "unknown",
  );
});

test("T026 a live iOS no-path event is disconnected and offline on the native path", async () => {
  const { reach, fake } = await startExpoNetwork(WIFI_STATE, "ios");

  fake.emit(NO_PATH_STATE);

  expect(reach.state.get()).toMatchObject({
    connection: { status: "disconnected", type: "none" },
    internet: { status: "offline" },
  });
  expect(reach.state.get().evidence["internet.status"].basis).toBe(
    "native-path",
  );
});

test("T026 an iOS refresh that reads no path cannot confirm it", async () => {
  const { reach, fake } = await startExpoNetwork(WIFI_STATE, "ios");

  fake.emit(NO_PATH_STATE);

  await expect(reach.refresh()).resolves.toMatchObject({
    status: "updated",
    state: { connection: { status: "unknown" } },
  });
});

test("a satisfied iOS path over an interface Expo cannot name is connected with no type", async () => {
  const { reach } = await startExpoNetwork(
    { type: "UNKNOWN", isConnected: true, isInternetReachable: true },
    "ios",
  );

  expect(reach.state.get().connection).toEqual({
    status: "connected",
    type: "unknown",
    transports: null,
  });
});

test("Android's validated network is online on native validation, never verified by Reach", async () => {
  const { reach } = await startExpoNetwork(WIFI_STATE, "android");

  expect(reach.state.get()).toMatchObject({
    connection: { status: "connected", type: "wifi" },
    internet: { status: "online" },
  });
  expect(reach.state.get().evidence["internet.status"].basis).toBe(
    "native-validation",
  );
});

test("Android's false reachability while connected stays unknown", async () => {
  const { reach } = await startExpoNetwork(
    { ...WIFI_STATE, isInternetReachable: false },
    "android",
  );

  expect(reach.state.get().connection.status).toBe("connected");
  expect(reach.state.get().internet.status).toBe("unknown");
  expect(reach.state.get().evidence["internet.status"].reason).toBe(
    "source-ambiguous",
  );
});

test("T027 Android's exception-shaped tuple is unknown, not offline", async () => {
  const { reach } = await startExpoNetwork(FAILED_READ_STATE, "android");

  expect(reach.state.get()).toMatchObject({
    connection: { status: "unknown", type: "unknown" },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"]).toMatchObject({
    status: "unknown",
    reason: "source-ambiguous",
  });
  expect(reach.condition({ internet: "offline" }).get().status).toBe("unknown");
});

test("Android's read of no active network is a trusted no path", async () => {
  const { reach } = await startExpoNetwork(NO_PATH_STATE, "android");

  expect(reach.state.get()).toMatchObject({
    connection: { status: "disconnected", type: "none" },
    internet: { status: "offline" },
  });
});

test("a state without a connection flag reports nothing", async () => {
  const { reach } = await startExpoNetwork({ type: "WIFI" }, "android");

  expect(reach.state.get()).toMatchObject({
    connection: { status: "unknown", type: "unknown" },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"].reason).toBe(
    "unobserved",
  );
});

test("T029 no transport set, cost or data preference is reported, so metering stays unknown", async () => {
  for (const platform of PLATFORMS) {
    const { reach } = await startExpoNetwork(CELLULAR_STATE, platform);
    const capabilities = reach.capabilities.get();

    expect(reach.state.get().connection.transports).toBeNull();
    expect(reach.state.get().cost).toEqual({ metered: null, expensive: null });
    expect(capabilities?.["cost.metered"].support).toBe("unsupported");
    expect(capabilities?.["connection.transports"].support).toBe("unsupported");
    expect(reach.condition({ metered: false }).get().status).toBe("unknown");
  }
});

test("each platform declares the internet evidence it can give", async () => {
  const ios = await startExpoNetwork(WIFI_STATE, "ios");
  const android = await startExpoNetwork(WIFI_STATE, "android");

  expect(ios.reach.capabilities.get()?.["internet.status"]).toEqual({
    support: "supported",
    notifications: "partial",
    bases: ["native-path"],
  });
  expect(android.reach.capabilities.get()?.["internet.status"]).toEqual({
    support: "supported",
    notifications: "partial",
    bases: ["native-validation", "native-path"],
  });
});

test("T041 an event that arrives before the first read wins over it", async () => {
  const fake = createFakeExpoNetwork(WIFI_STATE);

  fake.behavior.holdRead = true;

  const reach = new Reach({
    adapter: expoNetwork({ sdk: fake.sdk, platform: "android" }),
    clock: createTestClock(),
  });

  const ready = reach.start().ready;

  fake.emit(CELLULAR_STATE);
  fake.resolveRead(WIFI_STATE);
  await ready;
  await flush();

  expect(reach.state.get().connection.type).toBe("cellular");
});

test("a refresh reads Expo Network again", async () => {
  const { reach, fake } = await startExpoNetwork(WIFI_STATE, "android");

  fake.answer(CELLULAR_STATE);

  await expect(reach.refresh()).resolves.toMatchObject({
    status: "updated",
    state: { connection: { type: "cellular" } },
  });
  expect(fake.calls.reads).toBe(2);
});

test("T031 Expo Network is borrowed: only the adapter's own listener is removed, and the address is never read", async () => {
  const fake = createFakeExpoNetwork(WIFI_STATE);

  fake.sdk.addNetworkStateListener(() => {});

  const reach = new Reach({
    adapter: expoNetwork({ sdk: fake.sdk, platform: "ios" }),
    clock: createTestClock(),
  });

  const lease = reach.start();

  await lease.ready;

  expect(reach.native.get()).toBe(fake.sdk);
  expect(fake.listenerCount()).toBe(2);

  lease.release();

  expect(fake.listenerCount()).toBe(1);
  expect(fake.calls.ipAddress).toBe(0);
});
