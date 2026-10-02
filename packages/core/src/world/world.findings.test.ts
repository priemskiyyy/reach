import { expect, test } from "vitest";

import { createMockEndpoint } from "src/mock/createMockEndpoint";
import type { Activity } from "src/types/Activity";
import type { MonitorTrigger } from "src/types/MonitorTrigger";
import { ValueStore } from "src/utils/internal/observable/ValueStore";
import { Reach } from "src/utils/Reach";
import { settle } from "src/utils/Reach.fixture";
import { createWorld } from "src/world/createWorld.fixture";
import type { Truth } from "src/world/types/Truth";

// What the fuzz found and Reach fixed, each as a short script against the fake
// world. The expectation comes from what the world held, never from Reach's model.

const OFFLINE: Truth = { path: "none", reachable: null, metered: false };
const WIFI: Truth = { path: "wifi", reachable: true, metered: false };

const createRig = (initial: Truth, on: MonitorTrigger[]) => {
  const world = createWorld(initial);
  const probe = createMockEndpoint({ staleAfter: 30_000, monitoring: { on } });
  const activity = new ValueStore<Activity>("foreground");

  const reach = new Reach({
    adapter: world.adapter,
    clock: world.clock,
    activity: activity.observable,
    endpoints: { api: probe.definition },
  });

  return { world, probe, reach, setActivity: activity.update };
};

test("a path that came back while the app was suspended is checked on the resume", async () => {
  const { world, reach, probe, setActivity } = createRig(OFFLINE, [
    "foreground",
  ]);

  reach.start();
  await settle();
  reach.endpoint("api").monitor();
  setActivity("background");

  // The OS recovers while the process is suspended and tells nobody.
  world.change(WIFI, { notify: false });
  expect(reach.state.get().internet.status).toBe("offline");

  setActivity("foreground");
  await settle();

  expect(world.truth().path).toBe("wifi");
  expect(reach.state.get().internet.status).toBe("online");
  expect(probe.calls).toHaveLength(1);
});

test("a recovery the resume read reports starts one check when network-change is a trigger too", async () => {
  const { world, reach, probe, setActivity } = createRig(OFFLINE, [
    "network-change",
    "foreground",
  ]);

  reach.start();
  await settle();
  reach.endpoint("api").monitor();
  setActivity("background");
  world.change(WIFI, { notify: false });
  setActivity("foreground");
  await settle();

  expect(reach.diagnostics.get().counters.skippedChecks).toBe(1);
  expect(probe.calls).toHaveLength(1);
});

test("an interval tick on a cached offline does not skip while the world says the path is back", async () => {
  const world = createWorld(OFFLINE);

  const probe = createMockEndpoint({
    staleAfter: 30_000,
    monitoring: { on: ["start"], interval: 5_000, allowWithoutActivity: true },
  });

  const reach = new Reach({
    adapter: world.adapter,
    clock: world.clock,
    endpoints: { api: probe.definition },
  });

  reach.start();
  await settle();
  reach.endpoint("api").monitor();
  world.change(WIFI, { notify: false });
  world.clock.advance(5_000);
  await settle();

  expect(world.truth().path).toBe("wifi");
  expect(probe.calls).toHaveLength(1);
});
