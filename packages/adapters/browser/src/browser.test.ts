import { Reach } from "@priemskiyyy/reach";
import { createTestClock } from "@priemskiyyy/reach/mock";
import { expect, test } from "vitest";

import { browser } from "src/browser";
import { createFakeWindow } from "src/fakeWindow.fixture";

const startBrowser = (page: ReturnType<typeof createFakeWindow>) => {
  const reach = new Reach({
    adapter: browser({ target: page.window }),
    clock: createTestClock({ now: 1_000 }),
  });

  reach.start();

  return reach;
};

test("T145 creating the adapter reads nothing, and starting without a window is unsupported", async () => {
  const adapter = browser();
  const reach = new Reach({ adapter, clock: createTestClock() });

  await expect(reach.start().ready).rejects.toMatchObject({
    code: "SOURCE_ERROR",
    cause: expect.objectContaining({ code: "UNSUPPORTED_ENVIRONMENT" }),
  });
  expect(reach.state.get().connection.status).toBe("unknown");
});

test("T010 an online browser is a connected hint, never verified internet", () => {
  const reach = startBrowser(createFakeWindow());

  expect(reach.state.get()).toMatchObject({
    connection: { status: "connected", type: "unknown", transports: null },
    internet: { status: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"]).toEqual({
    status: "current",
    basis: "browser-hint",
    receivedAt: 1_000,
    reason: null,
  });
  expect(reach.state.get().evidence["internet.status"].status).toBe(
    "unsupported",
  );
});

test("T011 an offline browser is a disconnected hint, and internet stays unknown", () => {
  const page = createFakeWindow();
  const reach = startBrowser(page);
  const internet = reach.condition({ internet: "online" });

  page.goOffline();

  expect(reach.state.get().connection.status).toBe("disconnected");
  expect(reach.state.get().internet.status).toBe("unknown");
  expect(internet.get().status).toBe("unknown");
  expect(reach.condition({ connection: "connected" }).get().status).toBe(
    "unmet",
  );
});

test("an onLine that is not a Boolean is no evidence either way", () => {
  const reach = startBrowser(createFakeWindow({ onLine: "yes" }));

  expect(reach.state.get().connection.status).toBe("unknown");
});

test("T017 without Network Information only the online hint is supported", () => {
  const reach = startBrowser(createFakeWindow());
  const capabilities = reach.capabilities.get();

  expect(capabilities?.["connection.status"].support).toBe("supported");
  expect(capabilities?.["connection.type"].support).toBe("unsupported");
  expect(capabilities?.["preferences.saveData"].support).toBe("unsupported");
  expect(capabilities?.["cost.metered"].support).toBe("unsupported");
  expect(reach.state.get().preferences.saveData).toBeNull();
  expect(reach.native.get()).toEqual({ connection: null });
});

test("T018 each Network Information property is detected on its own", () => {
  const reach = startBrowser(
    createFakeWindow({ connection: { saveData: true } }),
  );

  const capabilities = reach.capabilities.get();

  expect(capabilities?.["connection.type"].support).toBe("unsupported");
  expect(capabilities?.["preferences.saveData"]).toEqual({
    support: "supported",
    notifications: "complete",
    bases: ["user-data-preference"],
  });
  expect(reach.state.get().connection.type).toBe("unknown");
});

test("T018 a reported connection type is kept, and an unknown one reports nothing", () => {
  const page = createFakeWindow({ connection: { type: "wifi" } });
  const reach = startBrowser(page);

  expect(reach.state.get().connection.type).toBe("wifi");

  page.changeConnection({ type: "5g-something" });
  expect(reach.state.get().connection.type).toBe("unknown");

  page.changeConnection({ type: "constructor" });
  expect(reach.state.get().connection.type).toBe("unknown");
});

test("T020 an effective type is never read as a radio or a transport", () => {
  const page = createFakeWindow({ connection: { type: "cellular" } });
  const reach = startBrowser(page);

  page.changeConnection({ type: "cellular" });

  expect(reach.state.get().connection).toEqual({
    status: "connected",
    type: "cellular",
    transports: null,
  });
});

test("T021 a data-saver preference is a preference, never a cost", () => {
  const page = createFakeWindow({ connection: { saveData: false } });
  const reach = startBrowser(page);

  page.changeConnection({ saveData: true });

  expect(reach.state.get().preferences.saveData).toBe(true);
  expect(reach.state.get().cost).toEqual({ metered: null, expensive: null });
});

test("T019 both event families are observed and a repeated report changes nothing", () => {
  const page = createFakeWindow({ connection: { type: "wifi" } });
  const reach = startBrowser(page);
  const state = reach.state.get();

  page.changeConnection({ type: "wifi" });
  page.goOnline();

  expect(reach.state.get()).toBe(state);

  page.changeConnection({ type: "ethernet" });
  page.goOffline();

  expect(reach.state.get().connection).toMatchObject({
    status: "disconnected",
    type: "ethernet",
  });
});

test("T091 hiding the page is a gap, and showing it again reads afresh", () => {
  const page = createFakeWindow();
  const reach = startBrowser(page);
  const { generation } = reach.state.get();

  page.pageHide();

  expect(reach.state.get().generation).toBe(generation + 1);
  expect(reach.state.get().evidence["connection.status"]).toMatchObject({
    status: "stale",
    reason: "observation-gap",
  });

  page.pageShow();
  expect(reach.state.get().connection.status).toBe("connected");
});

test("a frozen page is a gap until it resumes", () => {
  const page = createFakeWindow();
  const reach = startBrowser(page);

  page.freeze();
  expect(reach.state.get().connection.status).toBe("unknown");

  page.resume();
  expect(reach.state.get().connection.status).toBe("connected");
});

test("a refresh reads the browser again", async () => {
  const page = createFakeWindow();
  const reach = startBrowser(page);

  page.setOnLine(false);

  await expect(reach.refresh()).resolves.toMatchObject({
    status: "updated",
    state: { connection: { status: "disconnected" } },
  });
});

test("releasing removes every listener the adapter added", () => {
  const page = createFakeWindow({ connection: { type: "wifi" } });

  const reach = new Reach({
    adapter: browser({ target: page.window }),
    clock: createTestClock(),
  });

  const lease = reach.start();

  expect(page.listenerCount()).toBe(7);

  lease.release();
  expect(page.listenerCount()).toBe(0);
});
