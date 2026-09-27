import { expect, test, vi } from "vitest";

import { createMockEndpoint } from "src/mock/createMockEndpoint";
import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { CONNECTED_WIFI, createEndpointReach } from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

test("T081 a pass expires on its own and observers hear about it", async () => {
  const { reach, probe, api, clock } = createEndpointReach();
  const listener = vi.fn();

  reach.start();

  const checking = api.check();

  probe.pass();
  await checking;
  api.available.subscribe(listener);
  clock.advance(29_999);

  expect(api.available.get().status).toBe("met");
  expect(listener).not.toHaveBeenCalled();

  clock.advance(1);

  expect(listener).toHaveBeenCalledTimes(1);
  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "stale",
  });
  expect(api.available.get().reasons).toEqual([
    { code: "stale", field: null, endpoint: "api" },
  ]);
});

test("T082 a fail expires too, so one failure never blocks for good", async () => {
  const { reach, probe, api, clock } = createEndpointReach();

  reach.start();

  const checking = api.check();

  probe.fail();
  await checking;
  clock.advance(30_000);

  expect(api.state.get().status).toBe("unknown");
  expect(api.state.get().lastObservation?.verdict).toBe("fail");
});

test("T083 a result expires even while a recheck runs", async () => {
  const { reach, probe, api, clock } = createEndpointReach({
    endpoint: { timeout: 60_000 },
  });

  reach.start();

  const first = api.check();

  probe.pass();
  await first;
  api.check();
  clock.advance(30_000);

  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "stale",
    checking: true,
  });
});

test("T084 a read after the deadline answers stale before its timer runs, without notifying", async () => {
  const { reach, probe, api, clock } = createEndpointReach();
  const listener = vi.fn();

  reach.start();

  const checking = api.check();

  probe.pass();
  await checking;
  api.state.subscribe(listener);
  clock.skip(30_000);

  const stale = api.state.get();

  expect(stale).toMatchObject({ status: "unknown", freshness: "stale" });
  expect(api.state.get()).toBe(stale);
  expect(listener).not.toHaveBeenCalled();
  expect(probe.calls).toHaveLength(1);

  clock.runDue();
  expect(listener).toHaveBeenCalledTimes(1);
  expect(api.state.get()).toBe(stale);
});

test("T086 a sleep that paused the monotonic clock still expires a result", async () => {
  const { reach, probe, api, clock } = createEndpointReach();

  reach.start();

  const checking = api.check();

  probe.pass();
  await checking;
  clock.setNow(clock.now() + 60_000);

  expect(api.state.get().freshness).toBe("stale");
});

test("T089 results that expire together share one timer and one wake", async () => {
  const first = createMockEndpoint({ staleAfter: 30_000 });
  const second = createMockEndpoint({ staleAfter: 30_000 });
  const clock = createTestClock();

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock,
    endpoints: { first: first.definition, second: second.definition },
  });

  reach.start();

  const checks = [
    reach.endpoint("first").check(),
    reach.endpoint("second").check(),
  ];

  first.pass();
  second.pass();
  await Promise.all(checks);

  expect(clock.pendingTimers()).toBe(1);

  clock.advance(30_000);

  expect(reach.endpoint("first").state.get().freshness).toBe("stale");
  expect(reach.endpoint("second").state.get().freshness).toBe("stale");
  expect(clock.pendingTimers()).toBe(0);
});

test("releasing the runtime makes the endpoint's result stale and never checks again", async () => {
  const { reach, probe, api, clock } = createEndpointReach();
  const lease = reach.start();
  const checking = api.check();

  probe.pass();
  await checking;
  lease.release();
  clock.advance(60_000);

  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "stale",
  });
  expect(probe.calls).toHaveLength(1);
  expect(clock.pendingTimers()).toBe(0);
});
