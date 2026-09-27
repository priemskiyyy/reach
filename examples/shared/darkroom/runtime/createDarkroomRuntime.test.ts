import type { Activity, ObservableValue } from "@priemskiyyy/reach";
import { afterEach, expect, test, vi } from "vitest";

import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import type { DarkroomServices } from "example-shared/darkroom/runtime/types/DarkroomServices";
import { startDarkroom } from "example-shared/darkroom/runtime/startDarkroom";

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

const start = async () => {
  const { services, runtime } = startDarkroom({
    latency: 0,
    activity: FOREGROUND,
  });

  runtimes.push(runtime);

  await vi.waitFor(() => {
    expect(runtime.api.state.get().status).toBe("available");
  });

  return { services, runtime };
};

const readBackup = ({ roll }: DarkroomServices, id: number) =>
  roll.photos.get().find((photo) => photo.id === id)?.backup;

const countUploads = ({ backend }: DarkroomServices) =>
  backend.requests.getSnapshot().filter(({ method }) => method === "PUT")
    .length;

test("on home Wi-Fi a new photo backs up on its own to the signed-in account", async () => {
  const { services, runtime } = await start();

  const photo = services.roll.take();

  await vi.waitFor(() => {
    expect(readBackup(services, photo.id)).toEqual({
      state: "backed-up",
      account: "ines",
    });
  });
  expect(runtime.lastRun.get()).toMatchObject({
    trigger: "automatic",
    account: "ines",
    result: { state: "backed-up", uploaded: 1 },
  });
  expect(services.backend.requests.getSnapshot()[0]).toMatchObject({
    method: "PUT",
    path: `/photos/${photo.id}`,
    account: "ines",
    outcome: "stored",
  });
});

test("on cellular automatic backup pauses for metering, and Back up now uploads anyway", async () => {
  const { services, runtime } = await start();

  services.phone.setLink("cellular");

  await vi.waitFor(
    () => {
      expect(runtime.api.state.get()).toMatchObject({
        status: "available",
        lastObservation: {
          networkGeneration: runtime.reach.state.get().generation,
        },
      });
    },
    { timeout: 2_000 },
  );

  const photo = services.roll.take();

  expect(runtime.conditions.automatic.get()).toEqual({
    status: "unmet",
    reasons: [{ code: "mismatch", field: "cost.metered", endpoint: null }],
  });
  expect(readBackup(services, photo.id)).toEqual({ state: "waiting" });

  await runtime.backUpNow();

  expect(readBackup(services, photo.id)).toEqual({
    state: "backed-up",
    account: "ines",
  });
  expect(runtime.lastRun.get()).toMatchObject({
    trigger: "manual",
    condition: { status: "met" },
    result: { state: "backed-up", uploaded: 1 },
  });
});

test("with automatic backup off nobody monitors the API, and Back up now tries while it is unknown", async () => {
  const { services, runtime } = await start();

  services.automatic.set(false);
  runtime.api.invalidate();

  expect(runtime.reach.diagnostics.get().endpoints[0]?.monitors).toBe(0);
  expect(runtime.conditions.api.get()).toEqual({
    status: "unknown",
    reasons: [{ code: "stale", field: null, endpoint: "api" }],
  });

  const photo = services.roll.take();

  await runtime.backUpNow();

  expect(readBackup(services, photo.id)).toMatchObject({
    state: "backed-up",
  });
  expect(runtime.lastRun.get()).toMatchObject({
    trigger: "manual",
    condition: { status: "unknown" },
    result: { state: "backed-up", uploaded: 1 },
  });
});

test("a failed upload drops the API's answer and checks it again, instead of retrying", async () => {
  const { services, runtime } = await start();

  services.backend.setDegraded(true);

  const photo = services.roll.take();

  await vi.waitFor(() => {
    expect(runtime.api.state.get().lastObservation?.reason).toBe("test-failed");
  });
  expect(runtime.lastRun.get()).toMatchObject({
    trigger: "automatic",
    result: { state: "failed", uploaded: 0 },
  });
  expect(readBackup(services, photo.id)).toEqual({ state: "waiting" });
  expect(runtime.conditions.automatic.get().status).toBe("unmet");
  expect(countUploads(services)).toBe(1);
});

test("signed out, the API is not checked and Back up now asks to sign in", async () => {
  const { services, runtime } = await start();

  services.account.set(null);
  services.roll.take();

  expect(runtime.api.state.get()).toMatchObject({
    status: "unknown",
    scope: "unavailable",
  });
  expect(runtime.conditions.api.get().reasons).toEqual([
    { code: "scope-unavailable", field: null, endpoint: "api" },
  ]);

  await runtime.backUpNow();

  expect(runtime.lastRun.get()).toMatchObject({
    trigger: "manual",
    account: null,
    result: { state: "signed-out" },
  });
  expect(countUploads(services)).toBe(0);
});

test("behind a hotel's sign-in page the API's check fails, and Back up now refuses with the reason", async () => {
  const { services, runtime } = await start();

  services.phone.setLink("portal");

  await vi.waitFor(
    () => {
      expect(runtime.api.state.get()).toMatchObject({
        status: "unavailable",
        lastObservation: { reason: "request-failed" },
      });
    },
    { timeout: 4_000 },
  );

  services.roll.take();
  await runtime.backUpNow();

  expect(runtime.lastRun.get()).toMatchObject({
    trigger: "manual",
    condition: {
      status: "unmet",
      reasons: [{ code: "endpoint-unavailable", field: null, endpoint: "api" }],
    },
    result: { state: "refused" },
  });
  expect(countUploads(services)).toBe(0);
});

test("with nothing waiting, Back up now says so and sends nothing", async () => {
  const { services, runtime } = await start();

  await runtime.backUpNow();

  expect(runtime.lastRun.get()).toMatchObject({
    result: { state: "nothing-waiting" },
  });
  expect(countUploads(services)).toBe(0);
});

test("switching accounts checks the API again for the new account", async () => {
  const { services } = await start();

  services.account.set("kofi");

  await vi.waitFor(
    () => {
      expect(services.backend.requests.getSnapshot()[0]).toMatchObject({
        path: "/health",
        account: "kofi",
        outcome: "ready",
      });
    },
    { timeout: 2_000 },
  );
});

test("disposing aborts an upload in flight and puts its photo back to wait", async () => {
  const { services, runtime } = await start();

  services.backend.setLatency(5_000);

  const photo = services.roll.take();

  expect(readBackup(services, photo.id)).toEqual({ state: "uploading" });

  runtime.dispose();

  await vi.waitFor(() => {
    expect(readBackup(services, photo.id)).toEqual({ state: "waiting" });
  });
  expect(services.backend.requests.getSnapshot()[0]).toMatchObject({
    method: "PUT",
    outcome: "aborted",
  });
});

test("the timeline keeps each runtime's diagnostics under its source", async () => {
  const { services } = await start();

  const types = services.timeline.log
    .getSnapshot()
    .map(({ type, source }) => `${source}: ${type}`);

  expect(types).toContain("phone: lease-acquired");
  expect(types).toContain("phone: session-opened");
  expect(types).toContain("phone: check-completed");
});
