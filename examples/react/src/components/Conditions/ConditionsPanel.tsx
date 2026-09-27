import { ListChecks } from "@phosphor-icons/react";
import type React from "react";

import { CONDITION_IDS } from "example-shared/darkroom/network/constants/labels";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { ConditionRow } from "src/components/Conditions/ConditionRow";
import { Panel } from "src/components/Panel/Panel";

type ConditionsPanelProps = { runtime: DarkroomRuntime };

export const ConditionsPanel: React.FunctionComponent<ConditionsPanelProps> = ({
  runtime,
}) => (
  <Panel
    title="Conditions"
    icon={ListChecks}
    shows="Each condition Darkroom decides with, how it is built, and every reason it is not met."
  >
    <ul
      aria-label="Conditions"
      className="flex flex-col divide-y divide-slate-200/70 dark:divide-slate-800"
    >
      {CONDITION_IDS.map((id) => (
        <ConditionRow key={id} id={id} condition={runtime.conditions[id]} />
      ))}
    </ul>
  </Panel>
);
