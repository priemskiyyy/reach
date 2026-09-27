import type { Condition } from "src/types/Condition";
import { MET_CONDITION_STATE } from "src/utils/constants/conditions";
import { createConditionState } from "src/utils/internal/conditions/createConditionState";
import { deriveCondition } from "src/utils/internal/conditions/deriveCondition";

/**
 * Swaps met and unmet, and keeps unknown unknown: negation never turns
 * missing evidence into an answer. A negated met condition says so in its
 * reason.
 *
 * @example
 * ```ts
 * const offWifi = not(reach.condition({ type: "wifi" }));
 * ```
 */
export const not = (condition: Condition): Condition =>
  deriveCondition([condition], () => {
    const state = condition.get();

    if (state.status === "met") {
      return createConditionState("unmet", [
        { code: "negated", field: null, endpoint: null },
      ]);
    }

    if (state.status === "unmet") {
      return MET_CONDITION_STATE;
    }

    return state;
  });
