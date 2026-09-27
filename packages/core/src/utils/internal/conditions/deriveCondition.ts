import type { Condition } from "src/types/Condition";
import type { ConditionState } from "src/types/ConditionState";
import type { ObservableValue } from "src/types/ObservableValue";
import { EVALUATION_ERROR_CONDITION_STATE } from "src/utils/constants/conditions";
import { isSameConditionState } from "src/utils/internal/conditions/isSameConditionState";
import { DerivedValue } from "src/utils/internal/observable/DerivedValue";
import { Listeners } from "src/utils/internal/observable/Listeners";
import { reportUnhandledError } from "src/utils/internal/reporting/reportUnhandledError";
import { ReachError } from "src/utils/ReachError";

type DeriveConditionOptions = {
  report?: (error: ReachError) => void;
  listeners?: Listeners;
};

/** A condition over its sources whose evaluation failure answers unknown instead of throwing into a read. */
export const deriveCondition = (
  sources: ObservableValue<unknown>[],
  evaluate: () => ConditionState,
  {
    report = reportUnhandledError,
    listeners = new Listeners(),
  }: DeriveConditionOptions = {},
): Condition =>
  new DerivedValue({
    sources,
    compute: () => {
      try {
        return evaluate();
      } catch (error) {
        report(
          new ReachError({
            code: "EVALUATION_ERROR",
            message: "A condition's evaluator or one of its sources threw.",
            cause: error,
          }),
        );

        return EVALUATION_ERROR_CONDITION_STATE;
      }
    },
    isEqual: isSameConditionState,
    listeners,
  }).observable;
