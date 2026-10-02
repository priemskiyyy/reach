import { createMockEndpoint } from "src/mock/createMockEndpoint";
import type { Activity } from "src/types/Activity";
import { ValueStore } from "src/utils/internal/observable/ValueStore";
import { Reach } from "src/utils/Reach";
import { createWorld } from "src/world/createWorld.fixture";
import type { Rig } from "src/world/types/Rig";
import type { Step } from "src/world/types/Step";
import {
  CHECK_TIMEOUT,
  INITIAL,
  INTERVAL,
  MIN_INTERVAL,
  STALE_AFTER,
} from "src/world/worldConstants.fixture";

/** One Reach over a fake world with one monitored endpoint, as the script's setup says. */
export const createRig = (script: Step[]): Rig => {
  const world = createWorld(INITIAL);
  const activity = new ValueStore<Activity>("foreground");
  const setup = script.find((step) => step.kind === "setup");

  const probe = createMockEndpoint({
    staleAfter: STALE_AFTER,
    timeout: CHECK_TIMEOUT,
    monitoring: {
      on:
        setup?.kind === "setup"
          ? setup.on
          : ["start", "network-change", "foreground"],
      interval: INTERVAL,
      minInterval: MIN_INTERVAL,
    },
  });

  const reach = new Reach({
    adapter: world.adapter,
    clock: world.clock,
    activity: activity.observable,
    endpoints: {
      api: {
        ...probe.definition,
        check: (context) => {
          world.mark("probe-start", String(probe.calls.length));

          return probe.definition.check(context);
        },
      },
    },
  });

  const api = reach.endpoint("api");
  const state = reach.state.get();

  api.monitor();

  return {
    world,
    reach,
    probe,
    api,
    activity,
    online: reach.condition({ internet: "online" }),
    offline: reach.condition({ internet: "offline" }),
    violations: [],
    lease: null,
    disposed: false,
    step: -1,
    previous: state,
    disposedState: state,
  };
};
