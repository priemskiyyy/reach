import type { ConditionReason } from "src/types/ConditionReason";
import type { ConditionState } from "src/types/ConditionState";
import type { ConditionStatus } from "src/types/ConditionStatus";
import { MET_CONDITION_STATE } from "src/utils/constants/conditions";
import { freezeList } from "src/utils/internal/common/freezeList";
import { isSameReason } from "src/utils/internal/conditions/isSameReason";

/** A frozen state whose copied reasons keep their first-seen order without duplicates; met carries none. */
export const createConditionState = (
  status: ConditionStatus,
  reasons: ConditionReason[],
): ConditionState => {
  if (status === "met") {
    return MET_CONDITION_STATE;
  }

  const unique: ConditionReason[] = [];

  for (const { code, field, endpoint } of reasons) {
    const reason: ConditionReason = Object.freeze({ code, field, endpoint });

    if (unique.some((kept) => isSameReason(kept, reason))) {
      continue;
    }

    unique.push(reason);
  }

  return Object.freeze({ status, reasons: freezeList(unique) });
};
