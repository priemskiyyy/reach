import { Reach, UNKNOWN_NETWORK_STATE } from "@priemskiyyy/reach";
import type { CheckResult, ObservableValue } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import type { ObservationInput } from "@priemskiyyy/reach/mock";
import { cleanup, render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { afterEach, expect, test } from "vitest";

import { SERVER_CONDITION_STATE } from "../constants/serverSnapshots.js";
import type { ReachNetwork } from "../types/ReachNetwork.js";
import { useCondition } from "./useCondition.js";
import { useEndpoint } from "./useEndpoint.js";
import { useNetwork } from "./useNetwork.js";
import { useReach } from "./useReach.js";
import View from "./View.fixture.svelte";
import ViewHarness from "./ViewHarness.fixture.svelte";

afterEach(cleanup);

const CONNECTED_WIFI: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("wifi", "native-path"),
  },
  internet: { status: observed("online", "native-validation") },
};

const CONNECTED_CELLULAR: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("cellular", "native-path"),
  },
  internet: { status: observed("online", "native-validation") },
};

const DISCONNECTED: ObservationInput = {
  connection: {
    status: observed("disconnected", "native-path"),
    type: observed("none", "native-path"),
  },
  internet: { status: observed("offline", "native-path") },
};

const create = () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const probe = createMockEndpoint({ staleAfter: 30_000 });

  const network = new Reach({
    adapter: mock.adapter,
    clock: createTestClock({ now: 1_000 }),
    endpoints: { api: probe.definition },
  });

  return { mock, probe, network, api: network.endpoint("api") };
};

// A copy of an observable that counts its live listeners, which is what a leak looks like.
const countSubscriptions = <TValue>(observable: ObservableValue<TValue>) => {
  const live = { count: 0 };

  const counted: ObservableValue<TValue> = {
    get: observable.get,
    subscribe: (listener) => {
      live.count += 1;

      const stop = observable.subscribe(listener);

      return () => {
        live.count -= 1;
        stop();
      };
    },
  };

  return { live, counted };
};

// Mounts a component that runs `read` while it initializes, below a provider when given one.
const mount = <TValue>(
  read: () => TValue,
  provider?: { network: ReachNetwork; start?: boolean },
) => {
  let value: TValue | undefined;

  const handleRead = () => {
    value = read();
  };

  const view =
    provider === undefined
      ? render(View, { read: handleRead })
      : render(ViewHarness, { ...provider, read: handleRead });

  flushSync();

  return { value, dispose: view.unmount };
};

// Counts how often a value notifies, which is what an update is in Svelte.
const countRuns = (read: () => unknown) => {
  const runs = { count: 0 };

  $effect(() => {
    read();
    runs.count += 1;
  });

  return runs;
};

test("a utility used outside a provider fails with a message that names the provider", () => {
  expect(() => mount(() => useReach())).toThrow(
    expect.objectContaining({
      name: "ReachError",
      code: "INVALID_CONFIGURATION",
      // Svelte's development build appends the component stack to the message.
      message: expect.stringMatching(
        /^Reach utilities must be used within a ReachProvider\./,
      ),
    }),
  );
  expect(() => mount(() => useNetwork())).toThrow(
    expect.objectContaining({ code: "INVALID_CONFIGURATION" }),
  );
});

test("useNetwork reads the provider's Reach, or the one passed in without a provider", () => {
  const { network } = create();
  const provided = mount(() => useNetwork(), { network });
  const passed = mount(() => useNetwork(network));
  const reach = mount(() => useReach(), { network });

  expect(provided.value?.current).toBe(network.state.get());
  expect(passed.value?.current).toBe(network.state.get());
  expect(reach.value?.current).toBe(network);
});

test("T146 until mounted, the utilities read the server snapshots", () => {
  const { network, api } = create();
  let initial: unknown[] = [];

  mount(() => {
    const reads = [
      useNetwork(network),
      useCondition(network.condition({ internet: "online" })),
      useEndpoint(api),
    ];

    initial = reads.map((read) => read.current);
  });

  expect(initial[0]).toBe(UNKNOWN_NETWORK_STATE);
  expect(initial[1]).toBe(SERVER_CONDITION_STATE);
  expect(initial[2]).toMatchObject({ freshness: "never", scope: "unscoped" });
});

test("T149 the utilities observe only: nothing starts or checks", () => {
  const { mock, probe, network, api } = create();

  mount(() => {
    useNetwork(network);
    useCondition(network.condition({ internet: "online" }));
    useEndpoint(api);
  });

  expect(mock.stats().opens).toBe(0);
  expect(probe.calls).toHaveLength(0);
  expect(network.diagnostics.get().leases).toBe(0);
});

test("useNetwork changes when the state changes", async () => {
  const { mock, network } = create();
  const { value: state } = mount(() => useNetwork(network));
  const lease = network.start();

  await lease.ready;
  mock.emit(DISCONNECTED);

  expect(state?.current.connection.status).toBe("disconnected");
  lease.release();
});

test("T150 a selection notifies only when it changes", async () => {
  const { mock, network } = create();
  const lease = network.start();

  await lease.ready;

  const { value } = mount(() => {
    const status = useNetwork(network, (state) => state.connection.status);

    return { status, runs: countRuns(() => status.current) };
  });

  expect(value?.status.current).toBe("connected");

  const before = value?.runs.count;

  mock.emit(CONNECTED_CELLULAR);
  flushSync();

  expect(value?.runs.count).toBe(before);

  mock.emit(DISCONNECTED);
  flushSync();

  expect(value?.status.current).toBe("disconnected");
  expect(value?.runs.count).toBe((before ?? 0) + 1);
  lease.release();
});

test("an equality option keeps an equal selection from notifying again", async () => {
  const { mock, network } = create();
  const lease = network.start();

  await lease.ready;

  const { value } = mount(() => {
    const facts = useNetwork(
      network,
      (state) => [state.connection.status, state.internet.status],
      { isEqual: (previous, next) => previous.join() === next.join() },
    );

    return { facts, runs: countRuns(() => facts.current) };
  });

  const first = value?.facts.current;
  const before = value?.runs.count;

  mock.emit(CONNECTED_CELLULAR);
  flushSync();

  expect(value?.facts.current).toBe(first);
  expect(value?.runs.count).toBe(before);
  lease.release();
});

test("useCondition follows the condition", async () => {
  const { mock, network } = create();
  const online = network.condition({ internet: "online" });
  const { value: state } = mount(() => useCondition(online));
  const lease = network.start();

  await lease.ready;

  expect(state?.current.status).toBe("met");

  mock.emit(DISCONNECTED);

  expect(state?.current.status).toBe("unmet");
  lease.release();
});

test("useCondition selects from the condition", async () => {
  const { network } = create();
  const online = network.condition({ internet: "online" });

  const { value: status } = mount(() =>
    useCondition(online, ({ status }) => status),
  );

  const lease = network.start();

  await lease.ready;

  expect(status?.current).toBe("met");
  lease.release();
});

test("useEndpoint follows a check the application started", async () => {
  const { probe, network, api } = create();

  const { value } = mount(() => ({
    state: useEndpoint(api),
    checking: useEndpoint(api, (state) => state.checking),
  }));

  const lease = network.start();

  await lease.ready;

  const checks: Array<Promise<CheckResult>> = [api.check()];

  expect(value?.state.current.checking).toBe(true);
  expect(value?.checking.current).toBe(true);

  probe.pass();
  await Promise.all(checks);

  expect(value?.state.current).toMatchObject({
    status: "available",
    checking: false,
  });
  expect(value?.checking.current).toBe(false);
  lease.release();
});

test("unmounting removes every subscription the utilities added", () => {
  const { network, api } = create();
  const state = countSubscriptions(network.state);

  const condition = countSubscriptions(
    network.condition({ internet: "online" }),
  );

  const endpoint = countSubscriptions(api.state);

  const { dispose } = mount(() => {
    useNetwork({ state: state.counted, start: network.start });
    useCondition(condition.counted);
    useEndpoint({ ...api, state: endpoint.counted });
  });

  expect([state.live, condition.live, endpoint.live]).toEqual([
    { count: 1 },
    { count: 1 },
    { count: 1 },
  ]);

  dispose();

  expect([state.live, condition.live, endpoint.live]).toEqual([
    { count: 0 },
    { count: 0 },
    { count: 0 },
  ]);
});

test("T149 the provider starts nothing unless asked", () => {
  const { mock, network } = create();

  mount(() => undefined, { network });

  expect(mock.stats().opens).toBe(0);
  expect(network.status.get().state).toBe("idle");
});

test("T148 a starting provider holds one lease while mounted and never disposes the Reach", async () => {
  const { mock, network } = create();
  const { dispose } = mount(() => undefined, { network, start: true });

  await Promise.resolve();

  expect(network.status.get().state).toBe("running");
  expect(mock.stats().activeSessions).toBe(1);

  dispose();

  expect(network.status.get().state).toBe("idle");
  expect(mock.stats().activeSessions).toBe(0);

  const lease = network.start();

  await lease.ready;
  expect(network.status.get().state).toBe("running");
  lease.release();
});

test("the provider releases only its own lease", async () => {
  const { network } = create();
  const own = network.start();
  const { dispose } = mount(() => undefined, { network, start: true });

  await own.ready;
  dispose();

  expect(network.status.get().state).toBe("running");
  own.release();
});
