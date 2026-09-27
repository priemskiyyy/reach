import type { ConditionReason } from "src/types/ConditionReason";

const isSameEndpoint = (
  first: ConditionReason["endpoint"],
  second: ConditionReason["endpoint"],
) => {
  if (first === null) {
    return second === null;
  }

  if (second === null) {
    return false;
  }

  return first.name === second.name;
};

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

  return isSameEndpoint(first.endpoint, second.endpoint);
};
