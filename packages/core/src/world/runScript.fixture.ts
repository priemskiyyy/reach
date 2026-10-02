import { applyStep } from "src/world/applyStep.fixture";
import { checkOracles } from "src/world/checkOracles.fixture";
import { createRig } from "src/world/createRig.fixture";
import { flush } from "src/world/flush.fixture";
import type { Step } from "src/world/types/Step";
import type { Violation } from "src/world/types/Violation";

/** Runs one script and returns the first violation of each class it showed. */
export const runScript = async (script: Step[]): Promise<Violation[]> => {
  const rig = createRig(script);

  for (const step of script) {
    rig.step += 1;
    await applyStep(rig, step);
    await flush();
    checkOracles(rig, step);
  }

  rig.lease?.release();
  rig.reach.dispose();

  return rig.violations;
};
