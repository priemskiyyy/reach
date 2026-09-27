import type { Condition } from "@priemskiyyy/reach";
import { useCondition } from "@priemskiyyy/reach-react";
import type React from "react";

import {
  CONDITION_LABELS,
  CONDITIONS,
} from "example-shared/darkroom/network/constants/labels";
import type { ConditionId } from "example-shared/darkroom/network/types/ConditionId";
import { formatReasons } from "example-shared/formatting/formatReasons";
import { CONDITION_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

type ConditionRowProps = { id: ConditionId; condition: Condition };

export const ConditionRow: React.FunctionComponent<ConditionRowProps> = ({
  id,
  condition,
}) => {
  const { status, reasons } = useCondition(condition);
  const { title, code } = CONDITIONS[id];

  return (
    <li aria-label={title} className="flex min-w-0 flex-col gap-1.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{title}</span>
        <Badge tone={CONDITION_TONES[status]}>{CONDITION_LABELS[status]}</Badge>
      </div>
      <code className="font-mono text-xs wrap-break-word text-slate-500 dark:text-slate-400">
        {code}
      </code>
      {reasons.length === 0 ? null : (
        <p className="text-sm text-slate-700 first-letter:uppercase dark:text-slate-300">
          {formatReasons(reasons)}.
        </p>
      )}
    </li>
  );
};
