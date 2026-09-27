import { Reach } from "@priemskiyyy/reach";
import type { ObservableValue } from "@priemskiyyy/reach";
import {
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import type { ObservationInput } from "@priemskiyyy/reach/mock";
import { expect, test } from "vitest";

import { createFakeClient } from "src/fakeClient.fixture";
import type { Health } from "src/fakeClient.fixture";
import { http } from "src/http";
import type { HttpEndpointOptions } from "src/types/HttpEndpointOptions";

const CONNECTED_WIFI: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("wifi", "native-path"),
  },
};

const CONNECTED_CELLULAR: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("cellular", "native-path"),
  },
};

const settle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const createHttpReach = <TData>(endpoint: HttpEndpointOptions<TData>) => {
  const network = createMockNetwork({ initial: CONNECTED_WIFI });
  const clock = createTestClock({ now: 1_000 });

  const reach = new Reach({
    adapter: network.adapter,
    clock,
    endpoints: { api: http(endpoint) },
  });

  reach.start();

  return { network, clock, api: reach.endpoint("api") };
};

const isReady = ({ status }: Health) => status === "ready";

test("nothing is requested until a check is demanded", async () => {
  const client = createFakeClient();
  const { api } = createHttpReach({ request: client.request, staleAfter: 1 });

  await settle();
  expect(client.requests).toHaveLength(0);

  const checking = api.check();

  await settle();
  expect(client.requests).toHaveLength(1);

  client.answer({ status: "ready" });
  await checking;
});

test("a parsed answer that passes the test is available, and the answer is not kept", async () => {
  const client = createFakeClient();

  const { api } = createHttpReach({
    request: client.request,
    test: isReady,
    staleAfter: 30_000,
  });

  const checking = api.check();

  await settle();
  client.answer({ status: "ready" });

  const { observation, state } = await checking;

  expect(observation).toEqual({
    check: 1,
    verdict: "pass",
    response: "received",
    reason: null,
    startedAt: 1_000,
    completedAt: 1_000,
    networkGeneration: 1,
  });
  expect(state).toMatchObject({ status: "available", freshness: "fresh" });
});

test("T069 an answer the application's test accepts passes, and claims nothing about the user", async () => {
  const { api } = createHttpReach({
    // The application's client resolves an unauthorized answer as liveness.
    request: () => Promise.resolve({ code: 401 }),
    test: ({ code }) => code === 401,
    staleAfter: 30_000,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: { verdict: "pass", response: "received", reason: null },
    state: { status: "available" },
  });
});

test("T070 a parsed answer that fails the test is unavailable, with a received response", async () => {
  const client = createFakeClient();

  const { api } = createHttpReach({
    request: client.request,
    test: isReady,
    staleAfter: 30_000,
  });

  const checking = api.check();

  await settle();
  client.answer({ status: "degraded" });

  await expect(checking).resolves.toMatchObject({
    observation: {
      verdict: "fail",
      response: "received",
      reason: "test-failed",
    },
    state: { status: "unavailable" },
  });
});

test("without a test, any answer is available", async () => {
  const { api } = createHttpReach({
    request: () => undefined,
    staleAfter: 30_000,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: { verdict: "pass", response: "received" },
  });
});

test("T071 a rejected request is unavailable, with no claim that a response arrived", async () => {
  const client = createFakeClient();

  const { api } = createHttpReach({
    request: client.request,
    test: isReady,
    staleAfter: 30_000,
  });

  const checking = api.check();

  await settle();
  client.fail();

  await expect(checking).resolves.toMatchObject({
    observation: {
      verdict: "fail",
      response: "unknown",
      reason: "request-failed",
    },
    state: { status: "unavailable", error: null },
  });
});

test("a client that throws before answering is a rejected request too", async () => {
  const { api } = createHttpReach({
    request: () => {
      throw new Error("No client is signed in.");
    },
    staleAfter: 30_000,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: { verdict: "fail", reason: "request-failed" },
  });
});

test("a throwing test is the check's own error, never an unavailable endpoint", async () => {
  const client = createFakeClient();
  const failure = new Error("The test broke.");

  const { api } = createHttpReach({
    request: client.request,
    test: () => {
      throw failure;
    },
    staleAfter: 30_000,
  });

  const checking = api.check();

  await settle();
  client.answer({ status: "ready" });

  await expect(checking).rejects.toMatchObject({
    code: "PROBE_ERROR",
    cause: failure,
  });
  expect(api.state.get()).toMatchObject({
    status: "unknown",
    lastObservation: null,
    error: { code: "PROBE_ERROR" },
  });
});

test("the deadline covers the test as well as the request", async () => {
  const client = createFakeClient();

  const { api, clock } = createHttpReach({
    request: client.request,
    test: () => new Promise<boolean>(() => {}),
    staleAfter: 30_000,
    timeout: 3_000,
  });

  const checking = api.check();

  await settle();
  client.answer({ status: "ready" });
  await settle();
  clock.advance(3_000);

  await expect(checking).resolves.toMatchObject({
    observation: { verdict: "fail", reason: "timeout" },
  });
  expect(client.requests[0]?.signal.aborted).toBe(true);
});

test("the request carries the scope key, and its signal aborts on a network change", async () => {
  const client = createFakeClient();

  const scope: ObservableValue<string | null> = {
    get: () => "account-1",
    subscribe: () => () => {},
  };

  const { api, network } = createHttpReach({
    request: client.request,
    staleAfter: 30_000,
    scope,
  });

  const checking = api.check();

  await settle();

  const [sent] = client.requests;

  expect(sent?.scope).toBe("account-1");
  expect(sent?.signal.aborted).toBe(false);

  network.emit(CONNECTED_CELLULAR);

  await expect(checking).rejects.toMatchObject({ code: "SUPERSEDED" });
  expect(sent?.signal.aborted).toBe(true);
  expect(api.state.get().lastObservation).toBeNull();
});

test("an unscoped endpoint requests without a scope key", async () => {
  const client = createFakeClient();
  const { api } = createHttpReach({ request: client.request, staleAfter: 1 });

  const checking = api.check();

  await settle();
  client.answer({ status: "ready" });
  await checking;

  expect(client.requests[0]?.scope).toBeNull();
});

test("the definition keeps every endpoint option and takes the request as its check", () => {
  const client = createFakeClient();

  const definition = http({
    request: client.request,
    test: isReady,
    staleAfter: 30_000,
    timeout: 2_000,
    monitoring: { on: ["start"], interval: 60_000 },
  });

  expect(definition).toEqual({
    check: expect.any(Function),
    staleAfter: 30_000,
    timeout: 2_000,
    monitoring: { on: ["start"], interval: 60_000 },
  });
});

test("an answer that arrives after its check was aborted is never tested", async () => {
  const client = createFakeClient();
  const tested: Health[] = [];

  const { network, api } = createHttpReach({
    request: client.request,
    test: (health) => {
      tested.push(health);

      return isReady(health);
    },
    staleAfter: 30_000,
  });

  const checking = api.check();

  await settle();
  network.emit(CONNECTED_CELLULAR);
  await expect(checking).rejects.toMatchObject({ code: "SUPERSEDED" });

  client.answer({ status: "ready" });
  await settle();

  expect(tested).toEqual([]);
});
