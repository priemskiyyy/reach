import { expect, test } from "vitest";

import { createPhotosBackend } from "example-shared/backend/createPhotosBackend";

const signal = new AbortController().signal;

test("a direct health request answers ready and is logged for its account", async () => {
  const backend = createPhotosBackend({ latency: 0 });

  await expect(
    backend.health({ signal, account: "ines", route: "direct" }),
  ).resolves.toEqual({ status: "ready" });
  expect(backend.requests.getSnapshot()[0]).toMatchObject({
    method: "GET",
    path: "/health",
    account: "ines",
    outcome: "ready",
  });
});

test("a degraded API still answers its health, and refuses uploads", async () => {
  const backend = createPhotosBackend({ latency: 0 });

  backend.setDegraded(true);

  await expect(
    backend.health({ signal, account: "ines", route: "direct" }),
  ).resolves.toEqual({ status: "degraded" });
  await expect(
    backend.upload({ signal, account: "ines", photo: 4, route: "direct" }),
  ).rejects.toThrow("The photos API answered 503.");
  expect(backend.requests.getSnapshot()[0]).toMatchObject({
    method: "PUT",
    path: "/photos/4",
    outcome: "unavailable",
  });
});

test("an offline API answers 503 until it is back", async () => {
  const backend = createPhotosBackend({ latency: 0 });

  backend.setOffline(true);

  await expect(
    backend.health({ signal, account: "kofi", route: "direct" }),
  ).rejects.toThrow("The photos API answered 503.");

  backend.setOffline(false);

  await expect(
    backend.upload({ signal, account: "kofi", photo: 5, route: "direct" }),
  ).resolves.toEqual({ id: 5 });
  expect(backend.requests.getSnapshot()[0]).toMatchObject({
    outcome: "stored",
  });
});

test("without a signal a request fails at once, and behind a portal the client cannot parse the answer", async () => {
  const backend = createPhotosBackend({ latency: 1_000 });

  await expect(
    backend.health({ signal, account: "ines", route: "no-signal" }),
  ).rejects.toThrow("Failed to fetch");
  expect(backend.requests.getSnapshot()[0]).toMatchObject({
    outcome: "no-signal",
  });

  backend.setLatency(0);

  await expect(
    backend.health({ signal, account: "ines", route: "portal" }),
  ).rejects.toThrow(SyntaxError);
  expect(backend.requests.getSnapshot()[0]).toMatchObject({
    outcome: "portal",
  });
});

test("an aborted request is logged as aborted and rejects with the signal's reason", async () => {
  const backend = createPhotosBackend({ latency: 1_000 });
  const controller = new AbortController();

  const request = backend.health({
    signal: controller.signal,
    account: "ines",
    route: "direct",
  });

  controller.abort(new Error("timed out"));

  await expect(request).rejects.toThrow("timed out");
  expect(backend.requests.getSnapshot()[0]).toMatchObject({
    outcome: "aborted",
  });
});

test("a client that ignores abort keeps the request going and answers late", async () => {
  const backend = createPhotosBackend({ latency: 20 });
  const controller = new AbortController();

  backend.setIgnoreAbort(true);

  const request = backend.health({
    signal: controller.signal,
    account: "ines",
    route: "direct",
  });

  controller.abort(new Error("timed out"));

  await expect(request).resolves.toEqual({ status: "ready" });
  expect(backend.requests.getSnapshot()[0]).toMatchObject({
    outcome: "ready",
    late: true,
  });
});
