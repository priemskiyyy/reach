import { expect, test } from "vitest";

import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { observed } from "src/mock/observed";
import { testNetworkAdapter } from "src/testing/testNetworkAdapter";
import { NETWORK_FIELDS } from "src/utils/constants/network";
import { CONNECTED_CELLULAR, CONNECTED_WIFI } from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

test("a mock report on any basis rests on one the mock declares", async () => {
  const mock = createMockNetwork();
  const reach = new Reach({ adapter: mock.adapter, clock: createTestClock() });

  await reach.start().ready;
  mock.emit({
    connection: {
      status: observed("connected", "native-path"),
      type: observed("cellular", "provider-report"),
      transports: observed(["cellular"], "browser-hint"),
    },
    internet: { status: observed("online", "native-validation") },
    cost: {
      metered: observed(true, "native-metering"),
      expensive: observed(true, "native-expense"),
    },
    preferences: {
      constrained: observed(false, "user-data-preference"),
      saveData: observed(false),
    },
  });

  const { evidence } = reach.state.get();
  const capabilities = reach.capabilities.get();

  for (const field of NETWORK_FIELDS) {
    const fact = evidence[field];
    const capability = capabilities?.[field];

    expect(fact.status).toBe("current");
    expect(capability).toMatchObject({
      support: "supported",
      bases: expect.arrayContaining([fact.basis]),
    });
  }
});

test("a host change while no session is open reaches no closed session", async () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const reach = new Reach({ adapter: mock.adapter, clock: createTestClock() });
  const lease = reach.start();

  await lease.ready;
  lease.release();
  mock.emit(CONNECTED_CELLULAR);

  expect(reach.diagnostics.get().counters.lateCallbacks).toBe(0);
});

test("a new session reads the host as it is now, not as it began", async () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const reach = new Reach({ adapter: mock.adapter, clock: createTestClock() });
  const lease = reach.start();

  await lease.ready;
  mock.emit(CONNECTED_CELLULAR);
  lease.release();
  await reach.start().ready;

  expect(reach.state.get().connection.type).toBe("cellular");
});

test("a host change before the first session is read by that session", async () => {
  const mock = createMockNetwork();
  const reach = new Reach({ adapter: mock.adapter, clock: createTestClock() });

  mock.emit(CONNECTED_CELLULAR);
  await reach.start().ready;

  expect(reach.state.get().connection.type).toBe("cellular");
});

test("the mock network keeps the adapter contract", async () => {
  const { passed } = await testNetworkAdapter(() => {
    const mock = createMockNetwork({ initial: CONNECTED_WIFI });
    let wifi = true;

    return {
      adapter: mock.adapter,
      change: () => {
        wifi = !wifi;
        mock.emit(wifi ? CONNECTED_WIFI : CONNECTED_CELLULAR);
      },
      settle: () => Promise.resolve(),
      subscriptionCount: () => mock.stats().activeSessions,
    };
  });

  expect(passed).toHaveLength(7);
});

test("a gap or an error while no session is open reaches no closed session", async () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const reach = new Reach({ adapter: mock.adapter, clock: createTestClock() });
  const lease = reach.start();

  await lease.ready;
  lease.release();
  mock.invalidate();
  mock.reportError(new Error("closed"));
  mock.reserve().emit(CONNECTED_CELLULAR);

  expect(reach.diagnostics.get().counters.lateCallbacks).toBe(0);
});
