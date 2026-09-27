import type { ConditionState } from "src/types/ConditionState";
import type { ConditionStatus } from "src/types/ConditionStatus";

/** The reasons of every state with this status, in input order. */
export const getReasons = (states: ConditionState[], status: ConditionStatus) =>
  states.flatMap((state) => {
    if (state.status !== status) {
      return [];
    }

    return state.reasons;
  });
