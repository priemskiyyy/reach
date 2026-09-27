import { Reach } from "@priemskiyyy/reach";
import type { CheckResult, ObservableValue } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import type { ObservationInput } from "@priemskiyyy/reach/mock";
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import type { PropsWithChildren } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { ReachProvider } from "src/context/ReachProvider";
import { useCondition } from "src/hooks/useCondition";
import { useEndpoint } from "src/hooks/useEndpoint";
import { useNetwork } from "src/hooks/useNetwork";
import { useReach } from "src/hooks/useReach";

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
const countSubscriptions = <TValue,>(observable: ObservableValue<TValue>) => {
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

test("a hook used outside a provider fails with a message that names the provider", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  expect(() => renderHook(() => useReach())).toThrow(
    expect.objectContaining({
      name: "ReachError",
      code: "INVALID_CONFIGURATION",
      message: "Reach hooks must be used within a ReachProvider.",
    }),
  );
  expect(() => renderHook(() => useNetwork())).toThrow(
    expect.objectContaining({ code: "INVALID_CONFIGURATION" }),
  );
});

test("useNetwork reads the provider's Reach, or the one passed in without a provider", () => {
  const { network } = create();

  const wrapper = ({ children }: PropsWithChildren) => (
    <ReachProvider network={network}>{children}</ReachProvider>
  );

  const provided = renderHook(() => useNetwork(), { wrapper });
  const passed = renderHook(() => useNetwork(network));

  expect(provided.result.current).toBe(network.state.get());
  expect(passed.result.current).toBe(network.state.get());
  expect(renderHook(() => useReach(), { wrapper }).result.current).toBe(
    network,
  );
});

test("T147 the hooks observe only: nothing starts or checks", () => {
  const { mock, probe, network, api } = create();

  renderHook(() => {
    useNetwork(network);
    useCondition(network.condition({ internet: "online" }));
    useEndpoint(api);
  });

  expect(mock.stats().opens).toBe(0);
  expect(probe.calls).toHaveLength(0);
  expect(network.diagnostics.get().leases).toBe(0);
});

test("useNetwork renders again when the state changes", async () => {
  const { mock, network } = create();
  const { result } = renderHook(() => useNetwork(network));

  await act(async () => {
    await network.start().ready;
  });

  expect(result.current.connection.type).toBe("wifi");

  act(() => {
    mock.emit(CONNECTED_CELLULAR);
  });

  expect(result.current.connection.type).toBe("cellular");
});

test("a selection renders again only when it changes", async () => {
  const { mock, network } = create();
  const renders = vi.fn();

  const { result } = renderHook(() => {
    renders();

    return useNetwork(network, (state) => state.connection.status);
  });

  await act(async () => {
    await network.start().ready;
  });

  const rendered = renders.mock.calls.length;

  act(() => {
    mock.emit(CONNECTED_CELLULAR);
  });

  expect(result.current).toBe("connected");
  expect(renders).toHaveBeenCalledTimes(rendered);

  act(() => {
    mock.emit(DISCONNECTED);
  });

  expect(result.current).toBe("disconnected");
  expect(renders).toHaveBeenCalledTimes(rendered + 1);
});

test("an equality option keeps an equal selection from rendering again", async () => {
  const { mock, network } = create();
  const renders = vi.fn();

  const { result } = renderHook(() => {
    renders();

    return useNetwork(
      network,
      (state) => [state.connection.status, state.internet.status],
      { isEqual: (previous, next) => previous.join() === next.join() },
    );
  });

  await act(async () => {
    await network.start().ready;
  });

  const selected = result.current;
  const rendered = renders.mock.calls.length;

  act(() => {
    mock.emit(CONNECTED_CELLULAR);
  });

  expect(result.current).toBe(selected);
  expect(renders).toHaveBeenCalledTimes(rendered);
});

test("useCondition follows the condition", async () => {
  const { mock, network } = create();
  const online = network.condition({ internet: "online" });
  const { result } = renderHook(() => useCondition(online));

  expect(result.current.status).toBe("unknown");

  await act(async () => {
    await network.start().ready;
  });

  expect(result.current.status).toBe("met");

  act(() => {
    mock.emit(DISCONNECTED);
  });

  expect(result.current).toEqual({
    status: "unmet",
    reasons: [{ code: "mismatch", field: "internet.status", endpoint: null }],
  });
});

test("useCondition selects from the condition", async () => {
  const { network } = create();
  const online = network.condition({ internet: "online" });

  const { result } = renderHook(() =>
    useCondition(online, ({ status }) => status === "met"),
  );

  await act(async () => {
    await network.start().ready;
  });

  expect(result.current).toBe(true);
});

test("useEndpoint follows a check the application started", async () => {
  const { probe, network, api } = create();
  const { result } = renderHook(() => useEndpoint(api));

  const checking = renderHook(() =>
    useEndpoint(api, (state) => state.checking),
  );

  const checks: Array<Promise<CheckResult>> = [];

  await act(async () => {
    await network.start().ready;
    checks.push(api.check());
  });

  expect(result.current.checking).toBe(true);
  expect(checking.result.current).toBe(true);

  await act(async () => {
    probe.pass();
    await Promise.all(checks);
  });

  expect(result.current).toMatchObject({
    status: "available",
    checking: false,
  });
  expect(checking.result.current).toBe(false);
});

test("unmounting removes every subscription the hooks added", () => {
  const { network, api } = create();
  const state = countSubscriptions(network.state);

  const condition = countSubscriptions(
    network.condition({ internet: "online" }),
  );

  const endpoint = countSubscriptions(api.state);

  const view = renderHook(() => {
    useNetwork({ state: state.counted, start: network.start });
    useCondition(condition.counted);
    useEndpoint({ ...api, state: endpoint.counted });
  });

  expect([state.live, condition.live, endpoint.live]).toEqual([
    { count: 1 },
    { count: 1 },
    { count: 1 },
  ]);

  view.unmount();

  expect([state.live, condition.live, endpoint.live]).toEqual([
    { count: 0 },
    { count: 0 },
    { count: 0 },
  ]);
});

test("the provider starts nothing unless asked", () => {
  const { mock, network } = create();

  render(
    <ReachProvider network={network}>
      <span />
    </ReachProvider>,
  );

  expect(mock.stats().opens).toBe(0);
  expect(network.status.get().state).toBe("idle");
});

test("T148 a starting provider holds one lease while mounted and never disposes the Reach", async () => {
  const { mock, network } = create();

  const view = render(
    <StrictMode>
      <ReachProvider network={network} start>
        <span />
      </ReachProvider>
    </StrictMode>,
  );

  await act(async () => {
    await Promise.resolve();
  });

  expect(network.status.get().state).toBe("running");
  expect(mock.stats().activeSessions).toBe(1);

  view.unmount();

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

  const view = render(
    <ReachProvider network={network} start>
      <span />
    </ReachProvider>,
  );

  await act(async () => {
    await own.ready;
  });

  view.unmount();

  expect(network.status.get().state).toBe("running");
  own.release();
});
