import { expect, test } from "vitest";

import { createMockEndpoint } from "src/mock/createMockEndpoint";
import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import type { Activity } from "src/types/Activity";
import type { NetworkAdapter } from "src/types/NetworkAdapter";
import type { ObservableValue } from "src/types/ObservableValue";
import type { RuntimeLease } from "src/types/RuntimeLease";
import { CONNECTED_WIFI, createReach, settle } from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

// User code runs inside the runtime's own steps: diagnostics and state
// listeners, and adapter cleanups. Whatever it does there, the step that
// called it must continue from the state it left, never from a saved one.

const createCountingActivity = () => {
  let subscribers = 0;

  const activity: ObservableValue<Activity> = {
    get: () => "foreground",
    subscribe: () => {
      subscribers += 1;

      return () => {
        subscribers -= 1;
      };
    },
  };

  return { activity, subscribers: () => subscribers };
};

test("a diagnostics listener that starts again while a lease is acquired shares the one session", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });
  const leases: RuntimeLease[] = [];
  let nested = false;

  reach.diagnostics.events.subscribe(({ type }) => {
    if (type !== "lease-acquired" || nested) {
      return;
    }

    nested = true;
    leases.push(reach.start());
  });

  leases.push(reach.start());

  expect(mock.stats()).toMatchObject({ opens: 1, activeSessions: 1 });

  for (const lease of leases) {
    lease.release();
  }

  expect(mock.stats()).toMatchObject({ opens: 1, activeSessions: 0 });
  expect(reach.status.get()).toEqual({ state: "idle" });
});

test("a diagnostics listener that disposes while a lease is acquired leaves nothing open", async () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });

  reach.diagnostics.events.subscribe(({ type }) => {
    if (type === "lease-acquired") {
      reach.dispose();
    }
  });

  const lease = reach.start();

  await expect(lease.ready).rejects.toMatchObject({ code: "DISPOSED" });
  expect(mock.stats().opens).toBe(0);
  expect(reach.status.get()).toEqual({ state: "disposed" });
});

test("a state listener that disposes while the source is adopted leaves no activity subscribed", () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const probe = createMockEndpoint({ staleAfter: 30_000 });
  const { activity, subscribers } = createCountingActivity();

  const reach = new Reach({
    adapter: mock.adapter,
    clock: createTestClock(),
    activity,
    endpoints: { api: probe.definition },
  });

  const stop = reach.state.subscribe(() => {
    stop();
    reach.dispose();
  });

  reach.start();

  expect(reach.status.get()).toEqual({ state: "disposed" });
  expect(subscribers()).toBe(0);
});

test("a state listener that releases and starts again while the source is adopted readies the new lease only with its own session", async () => {
  const opens: Array<() => void> = [];

  const adapter: NetworkAdapter<null> = {
    name: "held",
    available: () => true,
    open: () =>
      new Promise((resolve) => {
        opens.push(() =>
          resolve({ native: null, capabilities: MOCK_CAPABILITIES }),
        );
      }),
  };

  const reach = new Reach({ adapter, clock: createTestClock() });
  const first = reach.start();
  let ready = false;

  const stop = reach.status.subscribe(() => {
    if (reach.status.get().state !== "running") {
      return;
    }

    stop();
    first.release();
    reach.start().ready.then(
      () => {
        ready = true;
      },
      () => {},
    );
  });

  first.ready.catch(() => {});
  opens[0]?.();
  await settle();

  expect(reach.status.get()).toEqual({ state: "starting" });
  expect(ready).toBe(false);

  opens[1]?.();
  await settle();

  expect(reach.status.get()).toMatchObject({ state: "running" });
  expect(ready).toBe(true);
});

test("an adapter cleanup that disposes during the last release leaves the Reach disposed", () => {
  const reachRef: { current: Reach<null> | null } = { current: null };

  const adapter: NetworkAdapter<null> = {
    name: "disposing-cleanup",
    available: () => true,
    open: (context) => {
      context.onDispose(() => reachRef.current?.dispose());

      return { native: null, capabilities: MOCK_CAPABILITIES };
    },
  };

  const reach = new Reach({ adapter, clock: createTestClock() });

  reachRef.current = reach;
  reach.start().release();

  expect(reach.status.get()).toEqual({ state: "disposed" });
  expect(reach.capabilities.get()).toBeNull();
});

test("a cleanup that disposes during the last release leaves no fact current", () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });

  const reachRef: { current: Reach<{ session: number }> | null } = {
    current: null,
  };

  const reach = new Reach({
    adapter: {
      ...mock.adapter,
      open: (context) => {
        context.onDispose(() => reachRef.current?.dispose());

        return mock.adapter.open(context);
      },
    },
    clock: createTestClock(),
  });

  reachRef.current = reach;
  reach.start().release();

  expect(reach.status.get()).toEqual({ state: "disposed" });
  expect(reach.state.get().evidence["connection.status"].status).toBe("stale");
});

test("a cleanup that starts again during the last release stops the old session first", () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const { activity, subscribers } = createCountingActivity();

  const reachRef: { current: Reach<{ session: number }> | null } = {
    current: null,
  };

  let opens = 0;

  const reach = new Reach({
    adapter: {
      ...mock.adapter,
      open: (context) => {
        opens += 1;

        if (opens === 1) {
          context.onDispose(() => {
            reachRef.current?.start();
          });
        }

        return mock.adapter.open(context);
      },
    },
    activity,
    clock: createTestClock(),
  });

  reachRef.current = reach;
  reach.start().release();

  expect(reach.status.get()).toMatchObject({ state: "running" });
  expect(subscribers()).toBe(1);
});

test("a cleanup whose new opening fails leaves no fact of the stopped session current", async () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI, open: "held" });

  const reachRef: { current: Reach<{ session: number }> | null } = {
    current: null,
  };

  let opens = 0;

  const reach = new Reach({
    adapter: {
      ...mock.adapter,
      open: (context) => {
        opens += 1;

        if (opens === 1) {
          context.onDispose(() => {
            reachRef.current?.start().ready.catch(() => {});
          });
        }

        return mock.adapter.open(context);
      },
    },
    clock: createTestClock(),
  });

  reachRef.current = reach;

  const lease = reach.start();

  mock.resolveOpen();
  await lease.ready;
  lease.release();
  mock.rejectOpen(new Error("no source"));
  await settle();

  expect(reach.status.get()).toMatchObject({ state: "error" });
  expect(reach.state.get().evidence["connection.status"].status).not.toBe(
    "current",
  );
});

test("a cleanup that starts and releases again publishes each stop once", () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });

  const reachRef: { current: Reach<{ session: number }> | null } = {
    current: null,
  };

  let opens = 0;

  const reach = new Reach({
    adapter: {
      ...mock.adapter,
      open: (context) => {
        opens += 1;

        if (opens === 1) {
          context.onDispose(() => {
            reachRef.current?.start().release();
          });
        }

        return mock.adapter.open(context);
      },
    },
    clock: createTestClock(),
  });

  const sessions: string[] = [];

  reachRef.current = reach;
  reach.diagnostics.events.subscribe(({ type }) => {
    if (type === "session-opened" || type === "session-stopped") {
      sessions.push(type);
    }
  });
  reach.start().release();

  expect(sessions).toEqual([
    "session-opened",
    "session-stopped",
    "session-opened",
    "session-stopped",
  ]);
});
