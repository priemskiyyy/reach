import type { ConditionState } from "src/types/ConditionState";
import type { ObservableValue } from "src/types/ObservableValue";

/**
 * A passive, synchronous, three-valued requirement over current evidence. It
 * never fetches, waits, queues or retries; observing it subscribes to its
 * sources and nothing else, and any object with this shape can consume it.
 *
 * @example
 * ```ts
 * const internet: Condition = reach.condition({ internet: "online" });
 * const stop = internet.subscribe(() => console.log(internet.get().status));
 * ```
 */
export type Condition = ObservableValue<ConditionState>;
