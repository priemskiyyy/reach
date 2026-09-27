import type {
  FieldCapability,
  NetworkField,
  NetworkState,
} from "@priemskiyyy/reach";
import type React from "react";

import {
  EVIDENCE_LABELS,
  FIELD_LABELS,
} from "example-shared/darkroom/network/constants/labels";
import { formatCapability } from "example-shared/formatting/formatCapability";
import { formatEvidence } from "example-shared/formatting/formatEvidence";
import { formatFactValue } from "example-shared/formatting/formatFactValue";
import { EVIDENCE_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

type EvidenceRowProps = {
  field: NetworkField;
  state: NetworkState;
  capability: FieldCapability | null;
};

export const EvidenceRow: React.FunctionComponent<EvidenceRowProps> = ({
  field,
  state,
  capability,
}) => {
  const evidence = state.evidence[field];

  return (
    <li
      aria-label={FIELD_LABELS[field]}
      className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {FIELD_LABELS[field]}
        </span>
        <span className="font-semibold">{formatFactValue(state, field)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={EVIDENCE_TONES[evidence.status]}>
          {EVIDENCE_LABELS[evidence.status]}
        </Badge>
        <span className="min-w-0 text-sm text-slate-600 dark:text-slate-400">
          {formatEvidence(evidence, field)}
        </span>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {formatCapability(capability)}
      </span>
    </li>
  );
};
