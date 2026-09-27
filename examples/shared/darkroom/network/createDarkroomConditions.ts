import { all } from "@priemskiyyy/reach";
import type { Condition } from "@priemskiyyy/reach";

import type { ConditionId } from "example-shared/darkroom/network/types/ConditionId";
import type { DarkroomReach } from "example-shared/darkroom/network/types/DarkroomReach";

/**
 * Every condition Darkroom decides with. Automatic backup needs the API and
 * a connection that is neither metered nor in Low Data Mode; being online
 * is shown beside them, and nothing in Darkroom waits on it alone.
 */
export const createDarkroomConditions = (
  reach: DarkroomReach,
): Record<ConditionId, Condition> => {
  const api = reach.endpoint("api").available;
  const unmetered = reach.condition({ metered: false, constrained: false });

  return {
    online: reach.condition({ internet: "online" }),
    unmetered,
    api,
    automatic: all(api, unmetered),
  };
};
