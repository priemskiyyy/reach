import type { ConditionState } from "src/types/ConditionState";
import { isSameReason } from "src/utils/internal/conditions/isSameReason";

export const isSameConditionState = (
  previous: ConditionState,
  next: ConditionState,
) => {
  if (previous.status !== next.status) {
    return false;
  }

  if (previous.reasons.length !== next.reasons.length) {
    return false;
  }

  return previous.reasons.every((reason, index) => {
    const other = next.reasons[index];

    if (other === undefined) {
      return false;
    }

    return isSameReason(reason, other);
  });
};
