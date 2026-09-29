import { flushSync, hydrate, unmount } from "svelte";
import { afterEach, expect, test, vi } from "vitest";

import { STATUS_MARKUP } from "./serverMarkup.fixture.js";
import { createStatus } from "./status.fixture.js";
import StatusHarness from "./StatusHarness.fixture.svelte";

afterEach(() => {
  document.body.replaceChildren();
});

test("T146 hydration reads the server snapshot, then the state the client already knows", async () => {
  const warn = vi.spyOn(console, "warn");
  const error = vi.spyOn(console, "error");

  // The client already knows it is online, and still hydrates from the server's snapshot.
  const { network, props } = createStatus();
  const lease = network.start();

  await lease.ready;

  const target = document.body.appendChild(document.createElement("div"));

  target.innerHTML = STATUS_MARKUP;

  const app = hydrate(StatusHarness, { target, props });

  flushSync();

  expect(warn.mock.calls).toEqual([]);
  expect(error.mock.calls).toEqual([]);
  expect(target.textContent).toBe("connected/met/never");

  unmount(app);
  lease.release();
});
