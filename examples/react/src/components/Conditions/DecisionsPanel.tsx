import { Scales } from "@phosphor-icons/react";
import type React from "react";

import {
  AUTOMATIC_DECISIONS,
  MANUAL_DECISIONS,
} from "example-shared/darkroom/backup/constants/decisions";
import {
  AUTOMATIC_DECISION_LABELS,
  MANUAL_DECISION_LABELS,
} from "example-shared/darkroom/backup/constants/labels";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import {
  AUTOMATIC_DECISION_TONES,
  MANUAL_DECISION_TONES,
} from "example-shared/ui/constants/tones";
import { DecisionRow } from "src/components/Conditions/DecisionRow";
import { Panel } from "src/components/Panel/Panel";

type DecisionsPanelProps = { runtime: DarkroomRuntime };

export const DecisionsPanel: React.FunctionComponent<DecisionsPanelProps> = ({
  runtime,
}) => (
  <Panel
    title="Decisions"
    icon={Scales}
    shows="Unknown is a status of its own, and each feature decides what to do with it. Nobody asked for an automatic backup, so it waits; somebody pressed Back up now, so it tries and lets the upload answer."
  >
    <ul aria-label="Decisions" className="flex flex-col gap-4">
      <DecisionRow
        title="Automatic backup"
        condition={runtime.conditions.automatic}
        decisions={AUTOMATIC_DECISIONS}
        labels={AUTOMATIC_DECISION_LABELS}
        tones={AUTOMATIC_DECISION_TONES}
      />
      <DecisionRow
        title="Back up now"
        condition={runtime.conditions.api}
        decisions={MANUAL_DECISIONS}
        labels={MANUAL_DECISION_LABELS}
        tones={MANUAL_DECISION_TONES}
      />
    </ul>
  </Panel>
);
