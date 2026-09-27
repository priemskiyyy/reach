import type { Condition } from "@priemskiyyy/reach";
import type { ConditionStatus } from "@priemskiyyy/reach";
import { useCondition } from "@priemskiyyy/reach-react";

import {
  CONDITION_LABELS,
  CONDITION_STATUS_ORDER,
} from "example-shared/darkroom/network/constants/labels";
import type { Tone } from "example-shared/ui/types/Tone";
import { decisionStyles } from "example-shared/ui/styles/decisionStyles";
import { Badge } from "src/components/Badge/Badge";

type DecisionRowProps<TDecision extends string> = {
  title: string;
  condition: Condition;
  decisions: Record<ConditionStatus, TDecision>;
  labels: Record<TDecision, string>;
  tones: Record<TDecision, Tone>;
};

/** One feature's decision for each status, with the one that holds now marked. */
export const DecisionRow = <TDecision extends string>({
  title,
  condition,
  decisions,
  labels,
  tones,
}: DecisionRowProps<TDecision>) => {
  const current = useCondition(condition, ({ status }) => status);

  return (
    <li aria-label={title} className="flex flex-col gap-2">
      <span className="font-semibold">{title}</span>
      <ul className="grid grid-cols-3 gap-2">
        {CONDITION_STATUS_ORDER.map((status) => (
          <li
            key={status}
            aria-current={status === current ? "true" : undefined}
            className={decisionStyles({ current: status === current })}
          >
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {CONDITION_LABELS[status]}
            </span>
            <Badge tone={tones[decisions[status]]}>
              {labels[decisions[status]]}
            </Badge>
          </li>
        ))}
      </ul>
    </li>
  );
};
