import type { Condition, ConditionState } from "@priemskiyyy/reach";

import { SERVER_CONDITION_STATE } from "src/constants/serverSnapshots";
import { useSelectedValue } from "src/hooks/internal/useSelectedValue";
import type { SelectorOptions } from "src/types/SelectorOptions";
import { selectValue } from "src/utils/selectValue";

/**
 * Reads a condition, `met`, `unmet` or `unknown` with its reasons, and
 * renders again when it changes; with a selector, only when the selection
 * changes. On the server and the hydrating render it reads `unknown`.
 *
 * @example
 * ```ts
 * const upload = useCondition(automaticUpload);
 * const canUpload = useCondition(automaticUpload, ({ status }) => status === "met");
 * ```
 */
export function useCondition(condition: Condition): ConditionState;

export function useCondition<TSelected>(
  condition: Condition,
  selector: (state: ConditionState) => TSelected,
  options?: SelectorOptions<NoInfer<TSelected>>,
): TSelected;

export function useCondition(
  condition: Condition,
  selector: (state: ConditionState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): unknown {
  return useSelectedValue(condition, SERVER_CONDITION_STATE, selector, isEqual);
}
