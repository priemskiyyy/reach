import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { Reach } from "@priemskiyyy/reach";
import type { ProbeContext } from "@priemskiyyy/reach";
import { createMockNetwork, observed } from "@priemskiyyy/reach/mock";
import type { ObservationInput } from "@priemskiyyy/reach/mock";
import { afterAll, beforeAll, expect, test } from "vitest";

import { http } from "src/http";
import type { HttpEndpointOptions } from "src/types/HttpEndpointOptions";

type Health = { status: "ready" | "degraded" };

const WIFI: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("wifi", "native-path"),
  },
};

const CELLULAR: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("cellular", "native-path"),
  },
};

// Every request the server saw, and whether its client went away before an answer.
const seen: Array<{ path: string; abandoned: boolean }> = [];

// A health endpoint on loopback: ready, degraded, failing, or never answering.
const server = createServer((request, response) => {
  const entry = { path: request.url ?? "", abandoned: false };

  seen.push(entry);
  response.on("close", () => {
    entry.abandoned = !response.writableEnded;
  });

  if (entry.path === "/ready") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ready" }));

    return;
  }

  if (entry.path === "/degraded") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "degraded" }));

    return;
  }

  if (entry.path === "/unavailable") {
    response.writeHead(503);
    response.end();
  }

  // Any other path hangs until the client gives up.
});

const origin = { url: "" };

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address: AddressInfo | string | null = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("The loopback server has no port.");
  }

  origin.url = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  server.closeAllConnections();

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

// The application's own client: real fetch, an error status as a rejection, the body as data.
const readHealth =
  (path: string) =>
  async ({ signal }: ProbeContext): Promise<Health> => {
    const response = await fetch(`${origin.url}${path}`, {
      signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`The health endpoint answered ${response.status}.`);
    }

    const health: Health = await response.json();

    return health;
  };

const startReach = async (endpoint: HttpEndpointOptions<Health>) => {
  const network = createMockNetwork({ initial: WIFI });

  const reach = new Reach({
    adapter: network.adapter,
    endpoints: { api: http(endpoint) },
  });

  await reach.start().ready;

  return { reach, network, api: reach.endpoint("api") };
};

const waitForRequest = async (path: string) => {
  while (!seen.some((entry) => entry.path === path)) {
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }
};

const waitForAbandoned = async (path: string) => {
  while (!seen.some((entry) => entry.path === path && entry.abandoned)) {
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }
};

const isReady = ({ status }: Health) => status === "ready";

test("a ready answer over a real connection is available", async () => {
  const { reach, api } = await startReach({
    request: readHealth("/ready"),
    test: isReady,
    staleAfter: 30_000,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: { verdict: "pass", response: "received" },
    state: { status: "available" },
  });

  reach.dispose();
});

test("a degraded answer over a real connection fails with a received response", async () => {
  const { reach, api } = await startReach({
    request: readHealth("/degraded"),
    test: isReady,
    staleAfter: 30_000,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: {
      verdict: "fail",
      response: "received",
      reason: "test-failed",
    },
  });

  reach.dispose();
});

test("an error status the client rejects fails without claiming a response", async () => {
  const { reach, api } = await startReach({
    request: readHealth("/unavailable"),
    test: isReady,
    staleAfter: 30_000,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: {
      verdict: "fail",
      response: "unknown",
      reason: "request-failed",
    },
  });

  reach.dispose();
});

test("a refused connection fails like any other rejected request", async () => {
  const closed = createServer();

  await new Promise<void>((resolve) => {
    closed.listen(0, "127.0.0.1", resolve);
  });

  const address: AddressInfo | string | null = closed.address();

  await new Promise<void>((resolve) => {
    closed.close(() => resolve());
  });

  if (address === null || typeof address === "string") {
    throw new Error("The closed server had no port.");
  }

  const { reach, api } = await startReach({
    request: ({ signal }) =>
      fetch(`http://127.0.0.1:${address.port}/ready`, { signal }).then(() => ({
        status: "ready",
      })),
    staleAfter: 30_000,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: { verdict: "fail", reason: "request-failed" },
  });

  reach.dispose();
});

test("a request past the deadline times out and the real connection is abandoned", async () => {
  const { reach, api } = await startReach({
    request: readHealth("/timeout"),
    staleAfter: 30_000,
    timeout: 200,
  });

  await expect(api.check()).resolves.toMatchObject({
    observation: { verdict: "fail", reason: "timeout" },
  });
  await waitForAbandoned("/timeout");

  reach.dispose();
});

test("a network change supersedes the check and abandons the real connection", async () => {
  const { reach, network, api } = await startReach({
    request: readHealth("/superseded"),
    staleAfter: 30_000,
  });

  const checking = api.check();

  await waitForRequest("/superseded");
  network.emit(CELLULAR);

  await expect(checking).rejects.toMatchObject({ code: "SUPERSEDED" });
  await waitForAbandoned("/superseded");
  expect(api.state.get().lastObservation).toBeNull();

  reach.dispose();
});
