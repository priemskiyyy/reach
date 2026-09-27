import { afterEach, expect, test, vi } from "vitest";

import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import type { ReachDiagnosticEvent } from "src/types/ReachDiagnosticEvent";
import {
  CONNECTED_CELLULAR,
  createEndpointReach,
  createReach,
  settle,
} from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

afterEach(() => {
  vi.restoreAllMocks();
});

test("T066 observing diagnostics starts, opens and checks nothing", () => {
  const { reach, mock, probe } = createEndpointReach();
  const listener = vi.fn();

  reach.diagnostics.subscribe(listener);
  reach.diagnostics.events.subscribe(listener);
  reach.diagnostics.get();

  expect(mock.stats().opens).toBe(0);
  expect(probe.calls).toHaveLength(0);
  expect(reach.diagnostics.get()).toEqual({
    runtime: "idle",
    adapter: "mock",
    session: null,
    networkGeneration: 0,
    capabilities: null,
    leases: 0,
    checks: { outstanding: 0, detached: 0 },
    endpoints: [
      {
        name: "api",
        monitors: 0,
        waiters: 0,
        status: "unknown",
        checking: false,
      },
    ],
    counters: {
      duplicateObservations: 0,
      discardedObservations: 0,
      lateCallbacks: 0,
      skippedChecks: 0,
      listenerErrors: 0,
      cleanupErrors: 0,
    },
  });
});

test("events are built only while someone listens, and never replay", () => {
  const clock = createTestClock({ now: 1_000 });
  const now = vi.fn(clock.now);

  const reach = new Reach({
    adapter: createMockNetwork().adapter,
    clock: { ...clock, now },
  });

  reach.start().release();

  expect(now).not.toHaveBeenCalled();

  const events: ReachDiagnosticEvent[] = [];

  reach.diagnostics.events.subscribe((event) => events.push(event));
  reach.start();

  expect(events.map((event) => event.type)).toEqual([
    "lease-acquired",
    "session-opening",
    "session-opened",
  ]);
  expect(events[2]).toEqual({
    type: "session-opened",
    timestamp: 1_000,
    session: 2,
    networkGeneration: 3,
    endpoint: null,
    check: null,
    reason: null,
  });
});

test("the snapshot keeps its identity until something changes, and observers hear once per burst", async () => {
  const { reach, mock } = createReach();
  const listener = vi.fn();

  reach.diagnostics.subscribe(listener);

  const idle = reach.diagnostics.get();

  expect(reach.diagnostics.get()).toBe(idle);

  reach.start();
  mock.emit(CONNECTED_CELLULAR);
  mock.emit(CONNECTED_CELLULAR);

  expect(listener).not.toHaveBeenCalled();

  await settle();

  expect(listener).toHaveBeenCalledTimes(1);
  expect(reach.diagnostics.get()).toMatchObject({
    runtime: "running",
    leases: 1,
    counters: { duplicateObservations: 1 },
  });
});

test("a throwing listener is counted and rethrown, and the others still hear", () => {
  const reported: unknown[] = [];

  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((task) => {
    try {
      task();
    } catch (error) {
      reported.push(error);
    }
  });

  const { reach, mock } = createReach();
  const failure = new Error("listener");
  const after = vi.fn();

  reach.start();
  reach.state.subscribe(() => {
    throw failure;
  });
  reach.state.subscribe(after);
  mock.emit(CONNECTED_CELLULAR);

  expect(after).toHaveBeenCalledTimes(1);
  expect(reported).toEqual([failure]);
  expect(reach.diagnostics.get().counters.listenerErrors).toBe(1);
});

test("disposal sends the final snapshot and ends every observation", () => {
  const { reach } = createReach();
  const listener = vi.fn();
  const events = vi.fn();

  reach.diagnostics.subscribe(listener);
  reach.diagnostics.events.subscribe(events);
  reach.dispose();

  expect(listener).toHaveBeenCalledTimes(1);
  expect(reach.diagnostics.get().runtime).toBe("disposed");

  reach.diagnostics.subscribe(listener)();
  expect(events).toHaveBeenCalledTimes(1);
});

test("T160 churn leaves no session, timer, check or listener behind", async () => {
  const { reach, mock, probe, api, clock } = createEndpointReach({
    endpoint: { timeout: 1_000 },
  });

  for (let round = 0; round < 50; round += 1) {
    const lease = reach.start();
    const stop = api.monitor();
    const unsubscribe = api.available.subscribe(() => {});
    const checking = api.check().catch(() => {});

    mock.emit(round % 2 === 0 ? CONNECTED_CELLULAR : undefined);
    clock.advance(1_000);
    await checking;
    unsubscribe();
    stop();
    lease.release();
  }

  for (const call of probe.calls) {
    if (!call.settled()) {
      call.resolve({ verdict: "pass", response: "received" });
    }
  }

  await settle();

  expect(mock.stats().activeSessions).toBe(0);
  expect(clock.pendingTimers()).toBe(0);
  expect(reach.diagnostics.get()).toMatchObject({
    runtime: "idle",
    leases: 0,
    checks: { outstanding: 0, detached: 0 },
    endpoints: [{ monitors: 0, waiters: 0, checking: false }],
  });
});

test("the snapshot reads each endpoint as it is now, after an invalidation or with time", async () => {
  const { reach, probe, api, clock } = createEndpointReach();

  reach.start();

  const first = api.check();

  probe.pass();
  await first;

  expect(reach.diagnostics.get().endpoints[0]?.status).toBe("available");

  api.invalidate();

  expect(reach.diagnostics.get().endpoints[0]?.status).toBe(
    api.state.get().status,
  );

  const second = api.check();

  probe.pass();
  await second;

  expect(reach.diagnostics.get().endpoints[0]?.status).toBe("available");

  // A suspended host wakes past the deadline before its timer runs.
  clock.skip(30_000);

  expect(api.state.get().status).toBe("unknown");
  expect(reach.diagnostics.get().endpoints[0]?.status).toBe("unknown");
});

test("a state listener reads the snapshot of the generation it hears", () => {
  const { reach, setActivity } = createEndpointReach({
    activity: "foreground",
  });

  const generations: Array<[number, number]> = [];

  reach.start();
  reach.state.subscribe(() => {
    generations.push([
      reach.state.get().generation,
      reach.diagnostics.get().networkGeneration,
    ]);
  });

  setActivity("background");
  reach.diagnostics.get();
  setActivity("foreground");

  expect(generations.length).toBeGreaterThan(0);

  for (const [state, snapshot] of generations) {
    expect(snapshot).toBe(state);
  }
});

test("observers hear an invalidation, which records no event", async () => {
  const { reach, probe, api } = createEndpointReach();
  const listener = vi.fn();

  reach.diagnostics.subscribe(listener);
  reach.start();

  const checking = api.check();

  probe.pass();
  await checking;
  await settle();
  listener.mockClear();

  api.invalidate();
  await settle();

  expect(listener).toHaveBeenCalledTimes(1);
});
