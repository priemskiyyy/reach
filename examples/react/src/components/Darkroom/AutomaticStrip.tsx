import { ArrowsClockwise } from "@phosphor-icons/react";
import { useCondition } from "@priemskiyyy/reach-react";
import type React from "react";

import { AUTOMATIC_DECISION_LABELS } from "example-shared/darkroom/backup/constants/labels";
import { AUTOMATIC_DECISIONS } from "example-shared/darkroom/backup/constants/decisions";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { formatAutomaticBackup } from "example-shared/formatting/formatAutomaticBackup";
import { AUTOMATIC_DECISION_TONES } from "example-shared/ui/constants/tones";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { Badge } from "src/components/Badge/Badge";

type AutomaticStripProps = {
  runtime: DarkroomRuntime;
  enabled: boolean;
  onAutomaticPress: () => void;
};

/** Whether automatic backup would run now, and the reasons its condition gives when not. */
export const AutomaticStrip: React.FunctionComponent<AutomaticStripProps> = ({
  runtime,
  enabled,
  onAutomaticPress,
}) => {
  const condition = useCondition(runtime.conditions.automatic);
  const decision = AUTOMATIC_DECISIONS[condition.status];

  return (
    <div
      role="group"
      aria-label="Automatic backup"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-sky-200/70 bg-sky-50/80 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/30"
    >
      <button
        type="button"
        aria-pressed={enabled}
        onClick={onAutomaticPress}
        className={buttonStyles({ size: "small", pressed: enabled })}
      >
        <ArrowsClockwise aria-hidden="true" size={14} weight="bold" />
        Automatic backup
      </button>
      {enabled ? (
        <Badge tone={AUTOMATIC_DECISION_TONES[decision]}>
          {AUTOMATIC_DECISION_LABELS[decision]}
        </Badge>
      ) : (
        <Badge tone="neutral">Off</Badge>
      )}
      <p className="min-w-0 flex-1 basis-60 text-sm text-slate-700 dark:text-slate-300">
        {formatAutomaticBackup(enabled, condition)}
      </p>
    </div>
  );
};
