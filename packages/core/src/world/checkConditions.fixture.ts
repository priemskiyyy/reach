import { flagViolation } from "src/world/flagViolation.fixture";
import { observeTruth } from "src/world/observeTruth.fixture";
import { readCondition } from "src/world/readCondition.fixture";
import type { Expected } from "src/world/types/Expected";
import type { Rig } from "src/world/types/Rig";

/** The online and offline conditions read what the world's last report on the internet says. */
export const checkConditions = (rig: Rig, expected: Expected) => {
  const internet =
    expected.kind === "truth"
      ? observeTruth(expected.truth).internet.status
      : null;

  const said =
    internet !== null && internet.status === "current"
      ? internet.value
      : "unknown";

  const { online, offline } = rig;

  if (online.get().status !== readCondition(said, "online")) {
    flagViolation(
      rig,
      "condition.online",
      `${online.get().status}, world said ${said}`,
    );
  }

  if (offline.get().status !== readCondition(said, "offline")) {
    flagViolation(
      rig,
      "condition.offline",
      `${offline.get().status}, world said ${said}`,
    );
  }
};
