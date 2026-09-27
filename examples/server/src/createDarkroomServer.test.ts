import { expect, test } from "vitest";

import { ACCOUNT_HEADER, createDarkroomServer } from "src/createDarkroomServer";

const listen = async () => {
  const host = createDarkroomServer();

  await new Promise<void>((resolve, reject) => {
    host.server.once("error", reject);
    host.server.listen(0, "127.0.0.1", resolve);
  });

  const address = host.server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Expected a TCP listener.");
  }

  return { ...host, origin: `http://127.0.0.1:${address.port}` };
};

const request = (
  origin: string,
  path: string,
  init: RequestInit & { account?: string } = {},
) => {
  const { account, ...rest } = init;

  return fetch(`${origin}${path}`, {
    ...rest,
    headers:
      account === undefined
        ? { "content-type": "application/json" }
        : { "content-type": "application/json", [ACCOUNT_HEADER]: account },
  });
};

const control = (origin: string, body: unknown) =>
  request(origin, "/api/control", {
    method: "POST",
    body: JSON.stringify(body),
  });

const readAnswer = async (response: Response) => {
  const body: unknown = await response.json();

  return { status: response.status, body };
};

test("health answers ready for the account in the header, and the log keeps it", async () => {
  const host = await listen();

  try {
    expect(
      await readAnswer(
        await request(host.origin, "/api/health", { account: "ines" }),
      ),
    ).toEqual({ status: 200, body: { status: "ready" } });
    expect(host.backend.requests.getSnapshot()).toMatchObject([
      { method: "GET", path: "/health", account: "ines", outcome: "ready" },
    ]);
  } finally {
    await host.dispose();
  }
});

test("a degraded API still answers its health, and refuses uploads", async () => {
  const host = await listen();

  try {
    await control(host.origin, { degraded: true });

    expect(
      await readAnswer(
        await request(host.origin, "/api/health", { account: "ines" }),
      ),
    ).toEqual({ status: 200, body: { status: "degraded" } });
    expect(
      (
        await request(host.origin, "/api/photos/4", {
          method: "PUT",
          account: "ines",
        })
      ).status,
    ).toBe(503);
  } finally {
    await host.dispose();
  }
});

test("an offline API answers 503 until the lab brings it back", async () => {
  const host = await listen();

  try {
    await control(host.origin, { offline: true });

    expect((await request(host.origin, "/api/health")).status).toBe(503);

    await control(host.origin, { offline: false });

    expect((await request(host.origin, "/api/health")).status).toBe(200);
  } finally {
    await host.dispose();
  }
});

test("an upload is stored for its account, and refused without one", async () => {
  const host = await listen();

  try {
    expect(
      await readAnswer(
        await request(host.origin, "/api/photos/5", {
          method: "PUT",
          account: "kofi",
        }),
      ),
    ).toEqual({ status: 201, body: { id: 5 } });
    expect(
      (await request(host.origin, "/api/photos/5", { method: "PUT" })).status,
    ).toBe(401);
  } finally {
    await host.dispose();
  }
});

test("a malformed change, account or photo is refused before it reaches the API", async () => {
  const host = await listen();

  try {
    expect((await control(host.origin, { latency: 5 })).status).toBe(400);
    expect((await control(host.origin, { failEverything: true })).status).toBe(
      400,
    );
    expect(
      (await request(host.origin, "/api/health", { account: "Inês!" })).status,
    ).toBe(400);
    expect(
      (
        await request(host.origin, "/api/photos/first", {
          method: "PUT",
          account: "ines",
        })
      ).status,
    ).toBe(400);
    expect(host.backend.state.get().latency).toBe(0);
    expect(host.backend.requests.getSnapshot()).toEqual([]);
  } finally {
    await host.dispose();
  }
});

test("a client that hangs up aborts its request on the API", async () => {
  const host = await listen();

  try {
    await control(host.origin, { latency: 6_000 });

    await expect(
      fetch(`${host.origin}/api/health`, { signal: AbortSignal.timeout(100) }),
    ).rejects.toThrow();

    await expect
      .poll(() => host.backend.requests.getSnapshot()[0]?.outcome)
      .toBe("aborted");
  } finally {
    await host.dispose();
  }
});

test("anything else answers 404, and a preflight answers with CORS", async () => {
  const host = await listen();

  try {
    expect((await request(host.origin, "/")).status).toBe(404);
    expect(
      (await request(host.origin, "/api/health", { method: "POST" })).status,
    ).toBe(404);

    const preflight = await request(host.origin, "/api/health", {
      method: "OPTIONS",
    });

    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-headers")).toContain(
      ACCOUNT_HEADER,
    );
  } finally {
    await host.dispose();
  }
});

test("an unstarted server has nothing to dispose", async () => {
  await expect(createDarkroomServer().dispose()).resolves.toBeUndefined();
});
