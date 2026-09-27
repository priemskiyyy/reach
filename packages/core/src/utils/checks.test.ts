import { runInNewContext } from "node:vm";

import { expect, test, vi } from "vitest";

import { createMockEndpoint } from "src/mock/createMockEndpoint";
import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { observed } from "src/mock/observed";
import type { ProbeResult } from "src/types/ProbeResult";
import { createDeferred } from "src/utils/internal/common/createDeferred";
import {
  CONNECTED_CELLULAR,
  CONNECTED_WIFI,
  createEndpointReach,
  settle,
} from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

test("T065 T066 handles are stable and observing them checks nothing", () => {
  const { reach, probe, api } = createEndpointReach();
  const listener = vi.fn();

  reach.start();
  api.state.subscribe(listener);
  api.available.subscribe(listener);
  reach.diagnostics.subscribe(listener);

  expect(reach.endpoint("api")).toBe(api);
  expect(reach.endpoint("api").available).toBe(api.available);
  expect(api.state.get()).toBe(api.state.get());
  expect(probe.calls).toHaveLength(0);
  expect(api.state.get()).toEqual({
    status: "unknown",
    freshness: "never",
    checking: false,
    scope: "unscoped",
    lastObservation: null,
    lastAttempt: null,
    error: null,
  });
});

test("T155 an endpoint named like an object member is an ordinary name", () => {
  const proto = createMockEndpoint({ staleAfter: 1_000 });
  const constructor = createMockEndpoint({ staleAfter: 1_000 });

  const reach = new Reach({
    adapter: createMockNetwork().adapter,
    clock: createTestClock(),
    endpoints: {
      ["__proto__"]: proto.definition,
      constructor: constructor.definition,
    },
  });

  expect(reach.endpoint("__proto__").name).toBe("__proto__");
  expect(reach.endpoint("constructor").name).toBe("constructor");
  expect(() =>
    // @ts-expect-error An endpoint that was never defined fails to compile.
    reach.endpoint("toString"),
  ).toThrow(expect.objectContaining({ code: "INVALID_CONFIGURATION" }));
});

test("a check needs a lease and rejects after disposal", async () => {
  const { reach, api } = createEndpointReach();

  await expect(api.check()).rejects.toMatchObject({ code: "NOT_STARTED" });

  reach.dispose();
  await expect(api.check()).rejects.toMatchObject({ code: "DISPOSED" });
  expect(() => api.monitor()).toThrow(
    expect.objectContaining({ code: "DISPOSED" }),
  );
});

test("T067 a passed check is fresh and available, with its timing and generation", async () => {
  const { reach, probe, api, clock } = createEndpointReach();

  reach.start();

  const checking = api.check();

  expect(api.state.get().checking).toBe(true);
  clock.advance(250);
  probe.pass();

  const { observation, state } = await checking;

  expect(observation).toEqual({
    check: 1,
    verdict: "pass",
    response: "received",
    reason: null,
    startedAt: 1_000,
    completedAt: 1_250,
    networkGeneration: 1,
  });
  expect(state).toMatchObject({
    status: "available",
    freshness: "fresh",
    checking: false,
    lastAttempt: { status: "observed", completedAt: 1_250 },
  });
  expect(api.available.get().status).toBe("met");
});

test("T068 a failed check is unavailable and leaves the network facts alone", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const network = reach.state.get();
  const checking = api.check();

  probe.fail("not-ready");

  await expect(checking).resolves.toMatchObject({
    observation: { verdict: "fail", reason: "not-ready" },
  });
  expect(api.state.get().status).toBe("unavailable");
  expect(reach.state.get()).toBe(network);
});

test("T079 an inconclusive check is fresh but unknown", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const checking = api.check();

  probe.inconclusive("opaque");
  await checking;

  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "fresh",
  });
  expect(api.available.get().reasons).toEqual([
    { code: "opaque", field: null, endpoint: "api" },
  ]);
});

test("T073 T107 a throwing check is a probe error that keeps the fresh result", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const first = api.check();

  probe.pass();
  await first;

  const failure = new Error("broken check");

  probe.throwNext(failure);

  await expect(api.check()).rejects.toMatchObject({
    code: "PROBE_ERROR",
    cause: failure,
  });
  expect(api.state.get()).toMatchObject({
    status: "available",
    freshness: "fresh",
    error: { code: "PROBE_ERROR" },
    lastAttempt: { status: "error" },
  });
  expect(reach.diagnostics.get().checks.outstanding).toBe(0);
});

test("T076 a check that outlives its deadline fails with a timeout, and its late pass is ignored", async () => {
  const { reach, probe, api, clock } = createEndpointReach({
    endpoint: { timeout: 3_000 },
  });

  reach.start();

  const checking = api.check();

  clock.advance(3_000);

  await expect(checking).resolves.toMatchObject({
    observation: { verdict: "fail", response: "unknown", reason: "timeout" },
  });
  expect(probe.calls[0]?.context.signal.aborted).toBe(true);

  probe.pass();
  await settle();

  expect(api.state.get().status).toBe("unavailable");
});

test("T088 a result that arrives after the deadline, before its timer runs, still times out", async () => {
  const { reach, probe, api, clock } = createEndpointReach({
    endpoint: { timeout: 3_000 },
  });

  reach.start();

  const checking = api.check();

  clock.skip(5_000);
  probe.pass();

  await expect(checking).resolves.toMatchObject({
    observation: { verdict: "fail", reason: "timeout" },
  });
});

test("T077 T078 a recheck never hides the result it may replace", async () => {
  const verdicts: Array<"pass" | "fail"> = ["pass", "fail"];

  for (const verdict of verdicts) {
    const { reach, probe, api } = createEndpointReach();

    reach.start();

    const first = api.check();

    probe[verdict]();
    await first;
    api.check();

    expect(api.state.get()).toMatchObject({
      status: verdict === "pass" ? "available" : "unavailable",
      checking: true,
    });
  }
});

test("T093 T094 simultaneous checks share one call, and each caller cancels only its own wait", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const controller = new AbortController();
  const cancelled = api.check({ signal: controller.signal });
  const others = Array.from({ length: 9 }, () => api.check());

  controller.abort();
  probe.pass();

  await expect(cancelled).rejects.toMatchObject({ code: "ABORTED" });

  const results = await Promise.all(others);

  expect(probe.calls).toHaveLength(1);
  expect(new Set(results).size).toBe(1);
  expect(probe.calls[0]?.context.signal.aborted).toBe(false);
});

test("T095 when every owner cancels, the check is aborted and records nothing", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const controller = new AbortController();
  const checking = api.check({ signal: controller.signal });

  controller.abort();

  await expect(checking).rejects.toMatchObject({ code: "ABORTED" });
  expect(probe.calls[0]?.context.signal.aborted).toBe(true);
  expect(api.state.get()).toMatchObject({
    freshness: "never",
    checking: false,
    lastAttempt: { status: "aborted" },
  });
});

test("T096 an already aborted signal rejects without calling the check", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const controller = new AbortController();

  controller.abort();

  await expect(api.check({ signal: controller.signal })).rejects.toMatchObject({
    code: "ABORTED",
  });
  expect(probe.calls).toHaveLength(0);
});

test("T098 two endpoints never share a check, whatever they call", async () => {
  const first = createMockEndpoint({ staleAfter: 1_000 });
  const second = createMockEndpoint({ staleAfter: 1_000 });

  const reach = new Reach({
    adapter: createMockNetwork().adapter,
    clock: createTestClock(),
    endpoints: { first: first.definition, second: second.definition },
  });

  reach.start();
  reach.endpoint("first").check();
  reach.endpoint("second").check();

  expect(first.calls).toHaveLength(1);
  expect(second.calls).toHaveLength(1);
});

test("T099 a check that calls check again joins itself", async () => {
  const reentered: Array<Promise<unknown>> = [];

  const holder: { check: () => Promise<unknown> } = {
    check: () => Promise.resolve(),
  };

  const reach = new Reach({
    adapter: createMockNetwork().adapter,
    clock: createTestClock(),
    endpoints: {
      api: {
        staleAfter: 1_000,
        check: async (): Promise<ProbeResult> => {
          reentered.push(holder.check());

          return { verdict: "pass", response: "received" };
        },
      },
    },
  });

  holder.check = () => reach.endpoint("api").check();
  reach.start();

  const result = await reach.endpoint("api").check();

  expect(reentered).toHaveLength(1);
  await expect(reentered[0]).resolves.toBe(result);
});

test("T100 T063 a route change supersedes the check before anyone reads the new network", async () => {
  const { reach, mock, probe, api } = createEndpointReach();

  reach.start();

  const first = api.check();

  probe.pass();
  await first;

  const checking = api.check();
  const seen: string[] = [];

  reach.state.subscribe(() => seen.push(api.available.get().status));
  mock.emit(CONNECTED_CELLULAR);

  await expect(checking).rejects.toMatchObject({ code: "SUPERSEDED" });
  expect(seen).toEqual(["unknown"]);
  expect(probe.calls[1]?.context.signal.aborted).toBe(true);

  probe.pass();
  await settle();

  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "stale",
    lastAttempt: { status: "superseded", reason: "network-change" },
  });
});

test("T101 invalidating drops the result and the check without checking again", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const first = api.check();

  probe.pass();
  await first;

  const checking = api.check();

  api.invalidate();

  await expect(checking).rejects.toMatchObject({ code: "SUPERSEDED" });
  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "stale",
  });
  expect(probe.calls).toHaveLength(2);
});

test("T105 a completion, a cancellation and disposal racing settle the waiter once and clean up once", async () => {
  const { reach, probe, api, mock } = createEndpointReach();
  const lease = reach.start();
  const controller = new AbortController();
  const settled = vi.fn();

  api.check({ signal: controller.signal }).then(settled, settled);

  probe.pass();
  controller.abort();
  reach.dispose();
  lease.release();
  reach.dispose();
  await settle();

  expect(settled).toHaveBeenCalledTimes(1);
  expect(mock.stats().cleanups).toBe(1);
  expect(reach.diagnostics.get().checks).toEqual({
    outstanding: 0,
    detached: 0,
  });
});

test("T102 T104 a check that ignores abort keeps its slot until its own promise settles", async () => {
  const { reach, probe, api, clock } = createEndpointReach({
    endpoint: { timeout: 1_000 },
  });

  reach.start();

  const checking = api.check();

  clock.advance(1_000);
  await checking;

  expect(reach.diagnostics.get().checks).toEqual({
    outstanding: 1,
    detached: 1,
  });

  probe.calls[0]?.reject(new Error("late failure"));
  await settle();

  expect(reach.diagnostics.get().checks).toEqual({
    outstanding: 0,
    detached: 0,
  });
  expect(api.state.get().lastObservation?.reason).toBe("timeout");
});

test("T103 a full set of running checks refuses another instead of queueing it", async () => {
  const { reach, clock, api } = createEndpointReach({
    endpoint: { timeout: 1_000 },
    maxOutstandingChecks: 1,
  });

  reach.start();

  const first = api.check();

  clock.advance(1_000);
  await first;

  await expect(api.check()).rejects.toMatchObject({
    code: "CAPACITY_EXHAUSTED",
  });
});

test("T106 releasing the last lease during a check supersedes it for good", async () => {
  const { reach, probe, api } = createEndpointReach();
  const lease = reach.start();
  const checking = api.check();

  lease.release();

  await expect(checking).rejects.toMatchObject({ code: "SUPERSEDED" });

  probe.pass();
  await settle();

  expect(api.state.get()).toMatchObject({
    freshness: "never",
    checking: false,
    lastAttempt: { status: "superseded", reason: "runtime-stopped" },
  });
});

test("T159 disposal rejects waiting checks and ignores their late results", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const checking = api.check();

  reach.dispose();

  await expect(checking).rejects.toMatchObject({ code: "DISPOSED" });

  probe.pass();
  await settle();

  expect(api.state.get().status).toBe("unknown");
});

test("T108 a check after a fresh result checks again", async () => {
  const { reach, probe, api } = createEndpointReach();

  reach.start();

  const first = api.check();

  probe.pass();
  await first;
  api.check();

  expect(probe.calls).toHaveLength(2);
});

test("a check during opening waits for it, then checks", async () => {
  const { reach, probe, mock, api } = createEndpointReach({
    network: { open: "held" },
  });

  reach.start();

  const checking = api.check();

  expect(probe.calls).toHaveLength(0);

  mock.resolveOpen();
  await settle();
  probe.pass();

  await expect(checking).resolves.toMatchObject({
    observation: { verdict: "pass" },
  });
});

test("T080 a local check can pass while the source reports no path", async () => {
  const { reach, probe, api, mock } = createEndpointReach();

  reach.start();
  mock.emit({
    connection: { status: observed("disconnected", "native-path") },
    internet: { status: observed("offline", "native-path") },
  });

  const checking = api.check();

  probe.pass();
  await checking;

  expect(api.available.get().status).toBe("met");
  expect(reach.state.get().internet.status).toBe("offline");
});

test("the check receives its scope and a signal that aborts once the network moves on", () => {
  const { reach, probe, api, mock } = createEndpointReach({
    network: { initial: CONNECTED_CELLULAR },
  });

  reach.start();
  api.check().catch(() => {});

  const context = probe.calls[0]?.context;

  expect(context?.scope).toBeNull();
  expect(context?.signal.aborted).toBe(false);

  mock.emit(CONNECTED_WIFI);
  expect(context?.signal.aborted).toBe(true);
});

test("a check whose promise comes from another realm is awaited", async () => {
  const ForeignPromise: PromiseConstructor = runInNewContext("Promise");

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock: createTestClock({ now: 1_000 }),
    endpoints: {
      api: {
        staleAfter: 30_000,
        check: () =>
          ForeignPromise.resolve<ProbeResult>({
            verdict: "pass",
            response: "received",
          }),
      },
    },
  });

  reach.start();

  await expect(reach.endpoint("api").check()).resolves.toMatchObject({
    observation: { verdict: "pass" },
    state: { status: "available" },
  });
});

test("a listener that ends a check before it runs frees its slot", async () => {
  const { reach, probe, api } = createEndpointReach({
    maxOutstandingChecks: 1,
  });

  reach.start();

  let ended = false;

  api.state.subscribe(() => {
    if (ended || !api.state.get().checking) {
      return;
    }

    ended = true;
    api.invalidate();
  });

  await expect(api.check()).rejects.toMatchObject({ code: "SUPERSEDED" });
  expect(probe.calls).toHaveLength(0);
  expect(reach.diagnostics.get().checks).toEqual({
    outstanding: 0,
    detached: 0,
  });

  const next = api.check();

  probe.pass();
  await expect(next).resolves.toMatchObject({ state: { status: "available" } });
});

test("a check whose abort listener calls back at its timeout commits only the timeout", async () => {
  const answer = createDeferred<ProbeResult>();
  const holder: { invalidate: () => void } = { invalidate: () => {} };
  const clock = createTestClock({ now: 1_000 });

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock,
    endpoints: {
      api: {
        staleAfter: 30_000,
        timeout: 1_000,
        check: ({ signal }) => {
          signal.addEventListener("abort", () => holder.invalidate());

          return answer.promise;
        },
      },
    },
  });

  const api = reach.endpoint("api");

  holder.invalidate = api.invalidate;
  reach.start();

  const checking = api.check();

  clock.advance(1_000);

  await expect(checking).resolves.toMatchObject({
    observation: { reason: "timeout" },
  });

  answer.resolve({ verdict: "pass", response: "received" });
  await settle();

  expect(reach.diagnostics.get().checks).toEqual({
    outstanding: 0,
    detached: 0,
  });
});

test("a check started from an abort listener keeps its running state", async () => {
  const holder: { check: () => Promise<unknown> } = {
    check: () => Promise.resolve(),
  };

  let calls = 0;

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock: createTestClock({ now: 1_000 }),
    endpoints: {
      api: {
        staleAfter: 30_000,
        check: ({ signal }) => {
          calls += 1;

          if (calls === 1) {
            signal.addEventListener("abort", () => {
              holder.check().catch(() => {});
            });
          }

          return new Promise<ProbeResult>(() => {});
        },
      },
    },
  });

  const api = reach.endpoint("api");

  holder.check = api.check;
  reach.start();
  api.check().catch(() => {});
  api.invalidate();

  expect(calls).toBe(2);
  expect(api.state.get()).toMatchObject({
    checking: true,
    lastAttempt: { check: 2, status: "running" },
  });
});

test("T096 a caller who aborts after the source opens but before its check starts sends nothing", async () => {
  const { reach, mock, probe, api } = createEndpointReach({
    network: { open: "held" },
  });

  reach.start();

  const controller = new AbortController();
  const checking = api.check({ signal: controller.signal });

  mock.resolveOpen();

  // The source is adopted and the wait is over, but the check has not begun.
  await Promise.resolve();
  await Promise.resolve();

  expect(probe.calls).toHaveLength(0);

  controller.abort();

  await expect(checking).rejects.toMatchObject({ code: "ABORTED" });
  expect(probe.calls).toHaveLength(0);
});

test("a check started when another endpoint's check is superseded belongs to the new network", async () => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI });
  const first = createMockEndpoint({ staleAfter: 30_000 });
  const second = createMockEndpoint({ staleAfter: 30_000 });

  const reach = new Reach({
    adapter: mock.adapter,
    clock: createTestClock({ now: 1_000 }),
    endpoints: { first: first.definition, second: second.definition },
  });

  const started: Array<Promise<unknown>> = [];

  reach.start();
  reach
    .endpoint("first")
    .check()
    .catch(() => {});
  reach.diagnostics.events.subscribe(({ type, endpoint }) => {
    if (type !== "check-superseded" || endpoint !== "first") {
      return;
    }

    started.push(reach.endpoint("second").check());
  });
  mock.emit(CONNECTED_CELLULAR);
  second.pass();

  await expect(started[0]).resolves.toMatchObject({
    state: { status: "available" },
  });
});

test("a check whose answer cannot be awaited fails as its own error and frees its slot", async () => {
  const answer = Promise.resolve<ProbeResult>({
    verdict: "pass",
    response: "received",
  });

  answer.then = () => {
    throw new Error("then");
  };

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock: createTestClock({ now: 1_000 }),
    endpoints: { api: { staleAfter: 30_000, check: () => answer } },
  });

  reach.start();

  await expect(reach.endpoint("api").check()).rejects.toMatchObject({
    code: "PROBE_ERROR",
  });
  expect(reach.diagnostics.get().checks).toEqual({
    outstanding: 0,
    detached: 0,
  });
});
