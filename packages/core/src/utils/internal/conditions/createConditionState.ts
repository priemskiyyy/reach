import type { ConditionReason } from "src/types/ConditionReason";
import type { ConditionState } from "src/types/ConditionState";
import type { ConditionStatus } from "src/types/ConditionStatus";
import { freezeList } from "src/utils/internal/common/freezeList";
import { isSameReason } from "src/utils/internal/conditions/isSameReason";

/** A frozen state whose copied reasons keep their first-seen order without duplicates. */
export const createConditionState = (
  status: ConditionStatus,
  reasons: ConditionReason[],
): ConditionState => {
  const unique: ConditionReason[] = [];

  for (const { code, field, endpoint } of reasons) {
    const reason: ConditionReason = Object.freeze({
      code,
      field,
      endpoint:
        endpoint === null ? null : Object.freeze({ name: endpoint.name }),
    });

    if (unique.some((kept) => isSameReason(kept, reason))) {
      continue;
    }

    unique.push(reason);
  }

  return Object.freeze({ status, reasons: freezeList(unique) });
};
