import type { ConditionReason } from "src/types/ConditionReason";
import type { ConditionStatus } from "src/types/ConditionStatus";

/**
 * One frozen assessment. `met` carries no reasons; `unmet` names the evidence
 * that contradicts the requirement, and `unknown` the evidence that is
 * missing, in a deterministic order without duplicates.
 *
 * @example
 * ```ts
 * const { status, reasons } = unmetered.get();
 * ```
 */
export type ConditionState = {
  status: ConditionStatus;
  reasons: ConditionReason[];
};
