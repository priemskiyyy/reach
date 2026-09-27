import type { ObservableValue } from "src/types/ObservableValue";

/**
 * The current value of every declared source, by the name it was declared
 * under, as a custom evaluator receives them.
 *
 * @example
 * ```ts
 * type Values = ConditionSourceValues<{ network: typeof reach.state }>;
 * ```
 */
export type ConditionSourceValues<
  TSources extends Record<string, ObservableValue<unknown>>,
> = {
  [TName in keyof TSources]: TSources[TName] extends ObservableValue<
    infer TValue
  >
    ? TValue
    : never;
};
