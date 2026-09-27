import type { ConditionReason } from "src/types/ConditionReason";
import type { ConditionStatus } from "src/types/ConditionStatus";
import { createConditionState } from "src/utils/internal/conditions/createConditionState";
import { ValueStore } from "src/utils/internal/observable/ValueStore";

export const STATUSES: ConditionStatus[] = ["met", "unmet", "unknown"];

export const reasonFor = (code: string): ConditionReason => ({
  code,
  field: null,
  endpoint: null,
});

// A condition whose state a test sets; met ones carry no reason, others carry `code`.
export const createConditionSource = (
  status: ConditionStatus,
  code: string = status,
) => {
  const store = new ValueStore(
    createConditionState(status, status === "met" ? [] : [reasonFor(code)]),
  );

  return {
    condition: store.observable,
    set: (next: ConditionStatus, nextCode: string = next) =>
      store.update(
        createConditionState(next, next === "met" ? [] : [reasonFor(nextCode)]),
      ),
  };
};
