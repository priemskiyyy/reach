import { expect, test } from "vitest";
import { renderToString } from "vue/server-renderer";

import { createView } from "src/context/view.fixture";

test("T146 a server render is unknown and inert", async () => {
  expect(typeof window).toBe("undefined");

  const { mock, probe, createApp } = createView();

  expect(await renderToString(createApp())).toBe(
    "<!--[--><span>unknown/unknown/never</span><!--]-->",
  );
  expect(mock.stats().opens).toBe(0);
  expect(probe.calls).toHaveLength(0);
});

test("T146 a server render reads unknown whatever the Reach knows", async () => {
  const { network, createApp } = createView();
  const lease = network.start();

  await lease.ready;

  expect(await renderToString(createApp())).toBe(
    "<!--[--><span>unknown/unknown/never</span><!--]-->",
  );
  lease.release();
});
