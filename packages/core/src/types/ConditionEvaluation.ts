import type { ConditionReason } from "src/types/ConditionReason";
import type { ConditionStatus } from "src/types/ConditionStatus";

/**
 * What a custom evaluator answers, synchronously: a status alone, or a status
 * with the reasons that explain it.
 *
 * @example
 * ```ts
 * const evaluation: ConditionEvaluation = {
 *   status: "unknown",
 *   reasons: [{ code: "settings-loading", field: null, endpoint: null }],
 * };
 * ```
 */
export type ConditionEvaluation =
  ConditionStatus | { status: ConditionStatus; reasons?: ConditionReason[] };
