import type { ConditionEvaluation } from "src/types/ConditionEvaluation";
import type { ConditionSourceValues } from "src/types/ConditionSourceValues";
import type { ObservableValue } from "src/types/ObservableValue";
import type { ReachError } from "src/utils/ReachError";

/**
 * A custom condition: the sources it reads, declared by name, and a pure,
 * synchronous evaluator over their current values. Only declared sources are
 * observed; a value the evaluator closes over is not.
 *
 * @example
 * ```ts
 * const options: ConditionOptions<{ network: typeof reach.state }> = {
 *   sources: { network: reach.state },
 *   evaluate: ({ network }) => (network.cost.metered === null ? "unknown" : "met"),
 * };
 * ```
 */
export type ConditionOptions<
  TSources extends Record<string, ObservableValue<unknown>>,
> = {
  sources: TSources;
  evaluate: (values: ConditionSourceValues<TSources>) => ConditionEvaluation;
  /** Receives an `EVALUATION_ERROR` when the evaluator or a source throws; it is rethrown asynchronously otherwise. */
  onError?: (error: ReachError) => void;
};
