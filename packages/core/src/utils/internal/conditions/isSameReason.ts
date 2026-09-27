import type { ConditionReason } from "src/types/ConditionReason";

export const isSameReason = (
  first: ConditionReason,
  second: ConditionReason,
) => {
  if (first.code !== second.code) {
    return false;
  }

  if (first.field !== second.field) {
    return false;
  }

  return first.endpoint === second.endpoint;
};
