import type React from "react";

import { TRIGGER_LABELS } from "example-shared/darkroom/backup/constants/labels";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { formatBackupRun } from "example-shared/formatting/formatBackupRun";
import { BACKUP_RESULT_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { useObservable } from "src/hooks/useObservable";

type RunNoticeProps = { runtime: DarkroomRuntime };

/** The last backup, automatic or asked for, and what came of it. */
export const RunNotice: React.FunctionComponent<RunNoticeProps> = ({
  runtime,
}) => {
  const run = useObservable(runtime.lastRun);

  if (run === null) {
    return (
      <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
        Take a photo: it backs up on its own, and what happened lands here.
      </p>
    );
  }

  return (
    <p
      key={`${run.id}-${run.result.state}`}
      role="status"
      className="flex animate-flash flex-wrap items-center gap-2 rounded-lg px-1 py-0.5 text-sm"
    >
      <Badge tone={BACKUP_RESULT_TONES[run.result.state]}>
        {TRIGGER_LABELS[run.trigger]}
      </Badge>
      <span className="min-w-0 flex-1">{formatBackupRun(run)}</span>
    </p>
  );
};
