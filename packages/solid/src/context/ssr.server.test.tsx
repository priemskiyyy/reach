import { renderToString } from "solid-js/web";
import { expect, test } from "vitest";

import { STATUS_MARKUP } from "src/context/serverMarkup.fixture";
import { createStatus } from "src/context/status.fixture";
import { StatusView } from "src/context/View.fixture";

test("T146 a server render is unknown and inert", () => {
  expect(typeof window).toBe("undefined");

  const { mock, probe, props } = createStatus();

  expect(renderToString(() => <StatusView {...props} />)).toBe(STATUS_MARKUP);
  expect(mock.stats().opens).toBe(0);
  expect(probe.calls).toHaveLength(0);
});

test("T146 a server render reads unknown whatever the Reach knows", async () => {
  const { network, props } = createStatus();
  const lease = network.start();

  await lease.ready;

  expect(renderToString(() => <StatusView {...props} />)).toBe(STATUS_MARKUP);
  lease.release();
});
