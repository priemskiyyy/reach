import type { Condition } from "src/types/Condition";
import type { ConditionOptions } from "src/types/ConditionOptions";
import type { ObservableValue } from "src/types/ObservableValue";
import { createConditionState } from "src/utils/internal/conditions/createConditionState";
import { deriveCondition } from "src/utils/internal/conditions/deriveCondition";
import { readConditionSources } from "src/utils/internal/conditions/readConditionSources";

/**
 * A condition over any declared sources, such as a network state and an
 * application setting. The evaluator is pure and synchronous; when it or a
 * source throws, the condition answers unknown with `evaluation-error`.
 *
 * @example
 * ```ts
 * const uploadPolicy = createCondition({
 *   sources: { network: reach.state, settings: uploadSettings },
 *   evaluate: ({ network, settings }) => {
 *     if (settings.allowAnyNetwork) {
 *       return "met";
 *     }
 *
 *     if (network.cost.metered === null) {
 *       return "unknown";
 *     }
 *
 *     return network.cost.metered ? "unmet" : "met";
 *   },
 * });
 * ```
 */
export const createCondition = <
  TSources extends Record<string, ObservableValue<unknown>>,
>({
  sources,
  evaluate,
  onError,
}: ConditionOptions<TSources>): Condition =>
  deriveCondition(
    Object.values(sources),
    () => {
      const evaluation = evaluate(readConditionSources(sources));

      if (typeof evaluation === "string") {
        return createConditionState(evaluation, []);
      }

      return createConditionState(evaluation.status, evaluation.reasons ?? []);
    },
    onError,
  );
