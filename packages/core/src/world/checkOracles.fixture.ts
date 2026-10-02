import { checkConditions } from "src/world/checkConditions.fixture";
import { checkFacts } from "src/world/checkFacts.fixture";
import { checkLifecycle } from "src/world/checkLifecycle.fixture";
import { flagViolation } from "src/world/flagViolation.fixture";
import { isBacked } from "src/world/isBacked.fixture";
import { replayLog } from "src/world/replayLog.fixture";
import type { Rig } from "src/world/types/Rig";
import type { Step } from "src/world/types/Step";

/** Every oracle, each derived from the world's log and never from Reach's model. */
export const checkOracles = (rig: Rig, step: Step) => {
  const { expected, epoch, epochs, accepted } = replayLog(rig.world.log);

  checkLifecycle(rig, step);
  checkFacts(rig, expected, accepted);
  checkConditions(rig, expected);

  if (
    rig.api.state.get().status === "available" &&
    !isBacked(rig, epochs, epoch)
  ) {
    flagViolation(
      rig,
      "endpoint.available-unbacked",
      "available without a pass that is fresh, in time and from this network",
    );
  }
};
