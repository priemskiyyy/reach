import { Reach, UNKNOWN_NETWORK_STATE } from "@priemskiyyy/reach";
import type { CheckResult, ObservableValue } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import type { ObservationInput } from "@priemskiyyy/reach/mock";
import { expect, test } from "vitest";
import { createApp, defineComponent, h, watch } from "vue";

import { SERVER_CONDITION_STATE } from "src/constants/serverSnapshots";
import { ReachProvider } from "src/context/ReachProvider";
import { useCondition } from "src/composables/useCondition";
import { useEndpoint } from "src/composables/useEndpoint";
import { useNetwork } from "src/composables/useNetwork";
import { useReach } from "src/composables/useReach";
import type { ReachNetwork } from "src/types/ReachNetwork";

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

// Mounts a component whose setup runs `read`, below a provider when given one.
const mount = <TValue>(
  read: () => TValue,
  provider?: { network: ReachNetwork; start?: boolean },
) => {
  let value: TValue | undefined;

  const Probe = defineComponent(() => {
    value = read();

    return () => null;
  });

  const Root = defineComponent(() => () => {
    if (provider === undefined) {
      return h(Probe);
    }

    return h(ReachProvider, provider, () => h(Probe));
  });

  const app = createApp(Root);

  app.config.warnHandler = () => {};

  app.mount(document.createElement("div"));

  return { value, dispose: app.unmount };
};

// Counts how often a ref notifies, which is what a render is in Vue.
const countRuns = (read: () => unknown) => {
  const runs = { count: 0 };

  watch(
    read,
    () => {
      runs.count += 1;
    },
    { flush: "sync" },
  );

  return runs;
};

test("a composable used outside a provider fails with a message that names the provider", () => {
  expect(() => mount(() => useReach())).toThrow(
    expect.objectContaining({
      name: "ReachError",
      code: "INVALID_CONFIGURATION",
      message: "Reach composables must be used within a ReachProvider.",
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

  expect(provided.value?.value).toBe(network.state.get());
  expect(passed.value?.value).toBe(network.state.get());
  expect(reach.value?.value).toBe(network);
});

test("T146 until mounted, the composables read the server snapshots", () => {
  const { network, api } = create();
  let initial: unknown[] = [];

  mount(() => {
    const reads = [
      useNetwork(network),
      useCondition(network.condition({ internet: "online" })),
      useEndpoint(api),
    ];

    initial = reads.map((read) => read.value);
  });

  expect(initial[0]).toBe(UNKNOWN_NETWORK_STATE);
  expect(initial[1]).toBe(SERVER_CONDITION_STATE);
  expect(initial[2]).toMatchObject({ freshness: "never", scope: "unscoped" });
});

test("T149 the composables observe only: nothing starts or checks", () => {
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

  expect(state?.value.connection.status).toBe("disconnected");
  lease.release();
});

test("T150 a selection notifies only when it changes", async () => {
  const { mock, network } = create();
  const lease = network.start();

  await lease.ready;

  const { value } = mount(() => {
    const status = useNetwork(network, (state) => state.connection.status);

    return { status, runs: countRuns(() => status.value) };
  });

  expect(value?.status.value).toBe("connected");

  const before = value?.runs.count;

  mock.emit(CONNECTED_CELLULAR);

  expect(value?.runs.count).toBe(before);

  mock.emit(DISCONNECTED);

  expect(value?.status.value).toBe("disconnected");
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

    return { facts, runs: countRuns(() => facts.value) };
  });

  const first = value?.facts.value;
  const before = value?.runs.count;

  mock.emit(CONNECTED_CELLULAR);

  expect(value?.facts.value).toBe(first);
  expect(value?.runs.count).toBe(before);
  lease.release();
});

test("useCondition follows the condition", async () => {
  const { mock, network } = create();
  const online = network.condition({ internet: "online" });
  const { value: state } = mount(() => useCondition(online));
  const lease = network.start();

  await lease.ready;

  expect(state?.value.status).toBe("met");

  mock.emit(DISCONNECTED);

  expect(state?.value.status).toBe("unmet");
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

  expect(status?.value).toBe("met");
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

  expect(value?.state.value.checking).toBe(true);
  expect(value?.checking.value).toBe(true);

  probe.pass();
  await Promise.all(checks);

  expect(value?.state.value).toMatchObject({
    status: "available",
    checking: false,
  });
  expect(value?.checking.value).toBe(false);
  lease.release();
});

test("unmounting removes every subscription the composables added", () => {
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
