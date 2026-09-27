import type { EvidenceBasis } from "src/types/EvidenceBasis";
import type { FieldObservation } from "src/types/FieldObservation";

/**
 * A current fact for a test observation, on the `custom` basis unless another
 * is given.
 *
 * @example
 * ```ts
 * const metered = observed(false, "native-metering");
 * ```
 */
export const observed = <TValue>(
  value: TValue,
  basis: Exclude<EvidenceBasis, "none"> = "custom",
): FieldObservation<TValue> => ({ status: "current", value, basis });
