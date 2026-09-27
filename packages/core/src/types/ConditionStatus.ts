/**
 * A three-valued answer: `met`, `unmet` when current evidence contradicts the
 * requirement, and `unknown` when there is no current evidence either way.
 * What `unknown` means for an action is the consumer's decision.
 *
 * @example
 * ```ts
 * const allowed = (status: ConditionStatus) => status === "met";
 * ```
 */
export type ConditionStatus = "met" | "unmet" | "unknown";
