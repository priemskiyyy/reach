import type { ConditionSourceValues } from "src/types/ConditionSourceValues";
import type { ObservableValue } from "src/types/ObservableValue";

// An overload pair instead of an assertion: building a mapped type from its
// keys erases which value belongs to which name, and nothing narrows it back.
export function readConditionSources<
  TSources extends Record<string, ObservableValue<unknown>>,
>(sources: TSources): ConditionSourceValues<TSources>;

export function readConditionSources(
  sources: Record<string, ObservableValue<unknown>>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const [name, source] of Object.entries(sources)) {
    values[name] = source.get();
  }

  return values;
}
