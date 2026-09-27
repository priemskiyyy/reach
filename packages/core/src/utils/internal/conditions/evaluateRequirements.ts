import type { ConditionReason } from "src/types/ConditionReason";
import type { ConditionState } from "src/types/ConditionState";
import type { NetworkRequirements } from "src/types/NetworkRequirements";
import type { NetworkState } from "src/types/NetworkState";
import { MET_CONDITION_STATE } from "src/utils/constants/conditions";
import { REQUIREMENT_RULES } from "src/utils/constants/requirements";
import { createConditionState } from "src/utils/internal/conditions/createConditionState";

/** Every required fact must match exactly; a fact without current evidence is unknown, never a mismatch. */
export const evaluateRequirements = (
  state: NetworkState,
  requirements: NetworkRequirements,
): ConditionState => {
  const unmet: ConditionReason[] = [];
  const unknown: ConditionReason[] = [];

  for (const rule of Object.values(REQUIREMENT_RULES)) {
    const required = rule.required(requirements);

    if (required === undefined) {
      continue;
    }

    const evidence = state.evidence[rule.field];

    if (evidence.status !== "current") {
      unknown.push({
        code: evidence.reason,
        field: rule.field,
        endpoint: null,
      });

      continue;
    }

    if (rule.actual(state) === required) {
      continue;
    }

    unmet.push({ code: "mismatch", field: rule.field, endpoint: null });
  }

  if (unmet.length > 0) {
    return createConditionState("unmet", unmet);
  }

  if (unknown.length > 0) {
    return createConditionState("unknown", unknown);
  }

  return MET_CONDITION_STATE;
};
