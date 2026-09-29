import type { Condition, ConditionState } from "@priemskiyyy/reach";
import { SERVER_CONDITION_STATE } from "../constants/serverSnapshots.js";
import type { ReadableValue } from "../types/ReadableValue.js";
import type { SelectorOptions } from "../types/SelectorOptions.js";
import { selectValue } from "../utils/selectValue.js";
import { useSelectedValue } from "./internal/useSelectedValue.svelte.js";

/**
 * Reads a condition, `met`, `unmet` or `unknown` with its reasons, through
 * `current`; with a selector, `current` changes only when the selection
 * changes. On the server and until mounted it reads `unknown`.
 *
 * @example
 * ```ts
 * const upload = useCondition(automaticUpload);
 * const canUpload = useCondition(automaticUpload, ({ status }) => status === "met");
 * ```
 */
export function useCondition(
  condition: Condition,
): ReadableValue<ConditionState>;

export function useCondition<TSelected>(
  condition: Condition,
  selector: (state: ConditionState) => TSelected,
  options?: SelectorOptions<NoInfer<TSelected>>,
): ReadableValue<TSelected>;

export function useCondition(
  condition: Condition,
  selector: (state: ConditionState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): ReadableValue<unknown> {
  return useSelectedValue(
    () => condition,
    SERVER_CONDITION_STATE,
    selector,
    isEqual,
  );
}
