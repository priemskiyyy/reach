import { expect, test, vi } from "vitest";

import { createMockEndpoint } from "src/mock/createMockEndpoint";
import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { observed } from "src/mock/observed";
import {
  CONNECTED_CELLULAR,
  CONNECTED_WIFI,
  createEndpointReach,
  settle,
} from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

test("T109 a monitor while idle is dormant demand: nothing opens and nothing is checked", () => {
  const { reach, mock, probe, api } = createEndpointReach();

  api.monitor();

  expect(mock.stats().opens).toBe(0);
  expect(probe.calls).toHaveLength(0);
  expect(reach.diagnostics.get().endpoints).toEqual([
    {
      name: "api",
      monitors: 1,
      waiters: 0,
      status: "unknown",
      checking: false,
    },
  ]);
});

test("T110 starting with two monitors checks once", () => {
  const { reach, probe, api } = createEndpointReach();

  api.monitor();
  api.monitor();
  reach.start();

  expect(probe.calls).toHaveLength(1);
});

test("T111 another monitor on a monitored endpoint starts nothing new", async () => {
  const { reach, probe, api, clock } = createEndpointReach();

  reach.start();
  api.monitor();
  probe.pass();
  await settle();
  clock.advance(5_000);
  api.monitor();

  expect(probe.calls).toHaveLength(1);
});

test("T112 a burst of network changes becomes one check after the minimum interval", async () => {
  const { reach, mock, probe, api, clock } = createEndpointReach();

  reach.start();
  api.monitor();
  probe.pass();
  await settle();

  for (const input of [
    CONNECTED_CELLULAR,
    CONNECTED_WIFI,
    CONNECTED_CELLULAR,
  ]) {
    clock.advance(100);
    mock.emit(input);
  }

  expect(probe.calls).toHaveLength(1);

  clock.advance(700);
  expect(probe.calls).toHaveLength(2);

  clock.advance(10_000);
  expect(probe.calls).toHaveLength(2);
});

test("T112 triggers inside the minimum interval wait as one start, even for a check that answers at once", () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const clock = createTestClock();

  let calls = 0;

  const reach = new Reach({
    adapter: mock.adapter,
    clock,
    endpoints: {
      api: {
        staleAfter: 30_000,
        check: () => {
          calls += 1;

          return { verdict: "pass", response: "received" };
        },
      },
    },
  });

  reach.start();
  reach.endpoint("api").monitor();

  for (const input of [
    CONNECTED_CELLULAR,
    CONNECTED_WIFI,
    CONNECTED_CELLULAR,
  ]) {
    clock.advance(100);
    mock.emit(input);
  }

  clock.advance(700);

  expect(calls).toBe(2);
});

test("a network change during a monitored check joins it", () => {
  const { reach, mock, probe, api, clock } = createEndpointReach();

  reach.start();
  api.monitor();
  clock.advance(5_000);
  mock.emit({ ...CONNECTED_WIFI, cost: { metered: observed(true) } });

  expect(probe.calls).toHaveLength(1);
});

test("T113 without an interval a monitor never polls", async () => {
  const { reach, probe, api, clock } = createEndpointReach();

  reach.start();
  api.monitor();
  probe.fail();
  await settle();
  clock.advance(60 * 60_000);

  expect(probe.calls).toHaveLength(1);
  expect(api.state.get().status).toBe("unknown");
});

test("an interval checks again from each completion, never catching up", async () => {
  const { reach, probe, api, clock } = createEndpointReach({
    endpoint: { monitoring: { interval: 60_000, allowWithoutActivity: true } },
  });

  reach.start();
  api.monitor();
  clock.advance(5_000);
  probe.pass();
  await settle();
  clock.advance(59_999);

  expect(probe.calls).toHaveLength(1);

  clock.advance(1);
  expect(probe.calls).toHaveLength(2);

  clock.skip(10 * 60_000);
  clock.runDue();
  expect(probe.calls).toHaveLength(2);
});

test("jitter only ever delays an interval", async () => {
  const { reach, probe, api, clock } = createEndpointReach({
    endpoint: {
      monitoring: { interval: 10_000, jitter: 0.5, allowWithoutActivity: true },
    },
  });

  clock.setRandom(0.5);
  reach.start();
  api.monitor();
  probe.pass();
  await settle();
  clock.advance(12_499);

  expect(probe.calls).toHaveLength(1);

  clock.advance(1);
  expect(probe.calls).toHaveLength(2);
});

test("T115 automatic checks wait for the foreground when an activity source exists", () => {
  const activities: Array<"background" | "unknown"> = ["background", "unknown"];

  for (const activity of activities) {
    const { reach, probe, api } = createEndpointReach({ activity });

    reach.start();
    api.monitor();

    expect(probe.calls).toHaveLength(0);
    expect(reach.diagnostics.get().counters.skippedChecks).toBe(1);
  }
});

test("T116 a manual check in the background is still the caller's decision", () => {
  const { reach, probe, api } = createEndpointReach({
    activity: "background",
  });

  reach.start();
  api.check();

  expect(probe.calls).toHaveLength(1);
});

test("T117 a return to the foreground refreshes the source and checks nothing unmonitored", () => {
  const { reach, mock, probe, setActivity } = createEndpointReach({
    activity: "background",
  });

  reach.start();
  setActivity("foreground");

  expect(mock.stats().refreshes).toBe(1);
  expect(probe.calls).toHaveLength(0);
});

test("T091 a return to the foreground ends older results and admits only foreground triggers", async () => {
  const { reach, probe, api, setActivity, clock } = createEndpointReach({
    activity: "foreground",
    endpoint: { monitoring: { on: ["foreground"] } },
  });

  reach.start();

  const first = api.check();

  probe.pass();
  await first;
  api.monitor();

  expect(probe.calls).toHaveLength(1);

  setActivity("background");
  clock.advance(5_000);
  setActivity("foreground");

  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "stale",
    checking: true,
  });
  expect(probe.calls).toHaveLength(2);
});

test("T118 without a foreground trigger a return to the foreground checks nothing", async () => {
  const { reach, probe, api, setActivity, clock } = createEndpointReach({
    activity: "foreground",
  });

  reach.start();
  api.monitor();
  probe.pass();
  await settle();
  setActivity("background");
  clock.advance(5_000);
  setActivity("foreground");

  expect(probe.calls).toHaveLength(1);
});

test("entering the background ends automatic-only work and keeps a manual caller's", () => {
  const automatic = createEndpointReach({ activity: "foreground" });

  automatic.reach.start();
  automatic.api.monitor();
  automatic.setActivity("background");

  expect(automatic.probe.calls[0]?.context.signal.aborted).toBe(true);
  expect(automatic.api.state.get().lastAttempt?.status).toBe("aborted");

  const manual = createEndpointReach({ activity: "foreground" });

  manual.reach.start();
  manual.api.monitor();
  manual.api.check();
  manual.setActivity("background");

  expect(manual.probe.calls[0]?.context.signal.aborted).toBe(false);
  expect(manual.api.state.get().checking).toBe(true);
});

test("T119 a native report of no path skips automatic checks, never a manual one", () => {
  const { reach, mock, probe, api } = createEndpointReach({
    network: {
      initial: {
        connection: { status: observed("disconnected", "native-path") },
        internet: { status: observed("offline", "native-path") },
      },
    },
  });

  reach.start();
  api.monitor();

  expect(probe.calls).toHaveLength(0);
  expect(reach.diagnostics.get().counters.skippedChecks).toBe(1);

  api.check();
  expect(probe.calls).toHaveLength(1);
  expect(mock.stats().opens).toBe(1);
});

test("whenOffline attempt checks even without a path", () => {
  const { reach, probe, api } = createEndpointReach({
    endpoint: { monitoring: { whenOffline: "attempt" } },
    network: {
      initial: { internet: { status: observed("offline", "native-path") } },
    },
  });

  reach.start();
  api.monitor();

  expect(probe.calls).toHaveLength(1);
});

test("T120 a browser offline hint never skips a check", () => {
  const { reach, probe, api } = createEndpointReach({
    network: {
      initial: {
        connection: { status: observed("disconnected", "browser-hint") },
      },
    },
  });

  reach.start();
  api.monitor();

  expect(probe.calls).toHaveLength(1);
});

test("T121 releasing the last monitor cancels the pending start", async () => {
  const { reach, mock, probe, api, clock } = createEndpointReach();

  reach.start();

  const stop = api.monitor();

  probe.pass();
  await settle();
  clock.advance(100);
  mock.emit(CONNECTED_CELLULAR);
  stop();
  stop();
  clock.advance(10_000);

  expect(probe.calls).toHaveLength(1);
  expect(clock.pendingTimers()).toBe(0);
});

test("T122 the last monitor leaving ends automatic-only work, not a manual caller's", () => {
  const alone = createEndpointReach();

  alone.reach.start();
  alone.api.monitor()();

  expect(alone.probe.calls[0]?.context.signal.aborted).toBe(true);

  const shared = createEndpointReach();

  shared.reach.start();

  const stop = shared.api.monitor();
  const checking = shared.api.check();

  stop();
  shared.probe.pass();

  return expect(checking).resolves.toMatchObject({
    observation: { verdict: "pass" },
  });
});

test("T097 a manual check joins monitored work and outlives the monitor", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const stop = api.monitor();
  const checking = api.check();

  expect(probe.calls).toHaveLength(1);

  stop();
  probe.pass();

  await expect(checking).resolves.toMatchObject({
    observation: { verdict: "pass" },
  });
});

test("T123 a monitor out of capacity skips without a hidden retry", async () => {
  const { reach, mock, probe, api, clock } = createEndpointReach({
    endpoint: { timeout: 1_000 },
    maxOutstandingChecks: 1,
  });

  reach.start();

  const stop = api.monitor();

  clock.advance(1_000);
  await settle();
  stop();
  api.monitor();
  clock.advance(60_000);

  expect(probe.calls).toHaveLength(1);
  expect(reach.diagnostics.get().counters.skippedChecks).toBe(1);

  mock.emit(CONNECTED_CELLULAR);
  expect(probe.calls).toHaveLength(1);
});

test("T124 an unknown availability never keeps monitoring from checking", async () => {
  const { reach, mock, probe, api, clock } = createEndpointReach();

  reach.start();
  api.monitor();
  probe.fail();
  await settle();
  clock.advance(30_000);

  expect(api.available.get().status).toBe("unknown");

  mock.emit(CONNECTED_CELLULAR);
  expect(probe.calls).toHaveLength(2);
});

test("a monitor's start trigger arrives once per runtime start", async () => {
  const { reach, probe, api, clock } = createEndpointReach();

  api.monitor();

  const lease = reach.start();

  probe.pass();
  await settle();
  lease.release();
  clock.advance(5_000);
  reach.start();

  expect(probe.calls).toHaveLength(2);
});

test("an interval goes on after a check it started is superseded", () => {
  const { reach, probe, api, clock } = createEndpointReach({
    endpoint: { monitoring: { interval: 10_000, allowWithoutActivity: true } },
  });

  reach.start();
  api.monitor();

  expect(probe.calls).toHaveLength(1);

  api.invalidate();
  clock.advance(10_000);

  expect(probe.calls).toHaveLength(2);
});

test("only a native report of no path skips a monitored check, never a hint of offline", () => {
  const { reach, mock, probe, api } = createEndpointReach();

  reach.start();
  mock.emit({
    connection: { status: observed("connected", "browser-hint") },
    internet: { status: observed("offline", "browser-hint") },
  });
  api.monitor();

  expect(probe.calls).toHaveLength(1);
});

test("a scope whose subscribe throws is reported, and the runtime still starts and monitors", () => {
  const reported: unknown[] = [];

  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((task) => {
    try {
      task();
    } catch (error) {
      reported.push(error);
    }
  });

  const failure = new Error("session store broke");

  const failing = {
    get: (): string | null => "account",
    subscribe: (): (() => void) => {
      throw failure;
    },
  };

  const probe = createMockEndpoint({ staleAfter: 30_000, scope: failing });

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock: createTestClock(),
    endpoints: { api: probe.definition },
  });

  reach.endpoint("api").monitor();

  expect(() => reach.start()).not.toThrow();
  expect(probe.calls).toHaveLength(1);
  expect(reported).toEqual([failure]);
  expect(reach.diagnostics.get().counters.listenerErrors).toBe(1);
});
