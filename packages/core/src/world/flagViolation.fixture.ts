import type { Rig } from "src/world/types/Rig";

/** Records the first violation of each class, with the step that showed it. */
export const flagViolation = (rig: Rig, kind: string, detail: string) => {
  if (rig.violations.some((violation) => violation.kind === kind)) {
    return;
  }

  rig.violations.push({ kind, step: rig.step, detail });
};
