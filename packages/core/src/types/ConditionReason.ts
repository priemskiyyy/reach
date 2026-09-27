import type { NetworkField } from "src/types/NetworkField";

/**
 * Why a condition is not met: a machine-readable `code` such as `mismatch`,
 * `unsupported`, `stale` or `endpoint-unavailable`, with the fact or the
 * endpoint it concerns. It is data for a consumer's own copy, never a
 * sentence, a timestamp or a secret.
 *
 * @example
 * ```ts
 * const reason: ConditionReason = { code: "unsupported", field: "cost.metered", endpoint: null };
 * ```
 */
export type ConditionReason = {
  code: string;
  field: NetworkField | null;
  /** The endpoint it concerns, by name, or `null`. */
  endpoint: string | null;
};
