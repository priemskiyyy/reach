import type { CheckResult } from "src/types/CheckResult";
import type { Condition } from "src/types/Condition";
import type { EndpointState } from "src/types/EndpointState";
import type { ObservableValue } from "src/types/ObservableValue";
import type { OperationOptions } from "src/types/OperationOptions";

/**
 * One named endpoint. Reading `state` or `available` never checks; `check`
 * performs or joins one check now, `monitor` acquires demand for the
 * definition's own monitoring, and `invalidate` drops the current result
 * without checking again.
 *
 * @example
 * ```ts
 * const api = reach.endpoint("api");
 * const stop = api.monitor();
 * const { observation } = await api.check();
 * ```
 */
export type EndpointHandle = {
  name: string;
  state: ObservableValue<EndpointState>;
  /** `met` while a current check passed; stable for the life of the Reach. */
  available: Condition;
  check: (options?: OperationOptions) => Promise<CheckResult>;
  monitor: () => () => void;
  invalidate: () => void;
};
