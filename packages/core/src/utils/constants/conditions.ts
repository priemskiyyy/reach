import type { ConditionState } from "src/types/ConditionState";
import { freezeList } from "src/utils/internal/common/freezeList";

/** The one met state: a met condition carries no reasons. */
export const MET_CONDITION_STATE: ConditionState = Object.freeze({
  status: "met",
  reasons: freezeList([]),
});

/** Why an evaluator that threw, or read itself, answers unknown. */
export const EVALUATION_ERROR_CONDITION_STATE: ConditionState = Object.freeze({
  status: "unknown",
  reasons: freezeList([
    Object.freeze({ code: "evaluation-error", field: null, endpoint: null }),
  ]),
});
