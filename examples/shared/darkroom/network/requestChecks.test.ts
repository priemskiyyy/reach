import type { Activity, ObservableValue } from "@priemskiyyy/reach";
import { afterEach, expect, test } from "vitest";

import { refreshNetwork } from "example-shared/darkroom/network/refreshNetwork";
import { requestChecks } from "example-shared/darkroom/network/requestChecks";
import { startDarkroom } from "example-shared/darkroom/runtime/startDarkroom";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import type { DarkroomServices } from "example-shared/darkroom/runtime/types/DarkroomServices";

const FOREGROUND: ObservableValue<Activity> = {
  get: () => "foreground",
  subscribe: () => () => {},
};

const runtimes: DarkroomRuntime[] = [];

afterEach(() => {
  for (const runtime of runtimes.splice(0)) {
    runtime.dispose();
  }
});

const countHealthChecks = ({ backend }: DarkroomServices) =>
  backend.requests.getSnapshot().filter(({ path }) => path === "/health")
    .length;

const start = () => {
  const started = startDarkroom({ latency: 0, activity: FOREGROUND });

  runtimes.push(started.runtime);
  started.services.automatic.set(false);

  return started;
};

test("two callers asking at once join one check, and one request answers both", async () => {
  const { services, runtime } = start();

  await runtime.reach.start().ready;
  await runtime.api.check();

  const before = countHealthChecks(services);
  const request = await requestChecks(runtime.api, 2);

  expect(request).toMatchObject({
    state: "settled",
    callers: 2,
    checks: 1,
    observation: { verdict: "pass" },
  });
  expect(countHealthChecks(services)).toBe(before + 1);
});

test("a check that cannot run is kept as a failed request, never thrown", async () => {
  const { services, runtime } = start();

  services.account.set(null);

  await expect(requestChecks(runtime.api, 1)).resolves.toMatchObject({
    state: "failed",
    callers: 1,
    error: { code: "SCOPE_UNAVAILABLE" },
  });
});

test("a refresh answers its status, and a refused one is kept as failed", async () => {
  const { runtime } = start();

  await runtime.reach.start().ready;

  await expect(refreshNetwork(runtime.reach)).resolves.toEqual({
    status: "unchanged",
  });

  runtime.reach.dispose();

  await expect(refreshNetwork(runtime.reach)).resolves.toMatchObject({
    status: "failed",
    error: { code: "DISPOSED" },
  });
});
