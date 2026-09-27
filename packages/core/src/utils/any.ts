import type { Condition } from "src/types/Condition";
import { MET_CONDITION_STATE } from "src/utils/constants/conditions";
import { createConditionState } from "src/utils/internal/conditions/createConditionState";
import { deriveCondition } from "src/utils/internal/conditions/deriveCondition";
import { getReasons } from "src/utils/internal/conditions/getReasons";

/**
 * Met when any condition is met, unmet when every one is unmet, and unknown
 * otherwise, with the reasons of the conditions that decided it.
 *
 * @example
 * ```ts
 * const reachable = any(api.available, backup.available);
 * ```
 */
export const any = (first: Condition, ...rest: Condition[]): Condition => {
  const conditions = [first, ...rest];

  return deriveCondition(conditions, () => {
    const states = conditions.map((condition) => condition.get());

    if (states.some((state) => state.status === "met")) {
      return MET_CONDITION_STATE;
    }

    if (states.some((state) => state.status === "unknown")) {
      return createConditionState("unknown", getReasons(states, "unknown"));
    }

    return createConditionState("unmet", getReasons(states, "unmet"));
  });
};
