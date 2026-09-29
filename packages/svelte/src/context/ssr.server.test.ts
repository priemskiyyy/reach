import { render } from "svelte/server";
import { expect, test } from "vitest";

import { STATUS_MARKUP } from "./serverMarkup.fixture.js";
import { createStatus } from "./status.fixture.js";
import StatusHarness from "./StatusHarness.fixture.svelte";

test("T146 a server render is unknown and inert", () => {
  expect(typeof window).toBe("undefined");

  const { mock, probe, props } = createStatus();

  expect(render(StatusHarness, { props }).body).toBe(STATUS_MARKUP);
  expect(mock.stats().opens).toBe(0);
  expect(probe.calls).toHaveLength(0);
});

test("T146 a server render reads unknown whatever the Reach knows", async () => {
  const { network, props } = createStatus();
  const lease = network.start();

  await lease.ready;

  expect(render(StatusHarness, { props }).body).toBe(STATUS_MARKUP);
  lease.release();
});
