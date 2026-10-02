import { runScript } from "src/world/runScript.fixture";
import type { Step } from "src/world/types/Step";

/** Drops one step at a time until every remaining step is needed to show the class. */
export const minimizeScript = async (script: Step[], kind: string) => {
  let current = script;
  let shrunk = true;

  while (shrunk) {
    shrunk = false;

    for (let position = current.length - 1; position >= 0; position -= 1) {
      const candidate = current.filter((_, index) => index !== position);
      const found = await runScript(candidate);

      if (found.some((violation) => violation.kind === kind)) {
        current = candidate;
        shrunk = true;
      }
    }
  }

  return current;
};
