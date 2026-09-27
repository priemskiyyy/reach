import type React from "react";

import {
  EVIDENCE_LABELS,
  EVIDENCE_MEANINGS,
  EVIDENCE_ORDER,
} from "example-shared/darkroom/network/constants/labels";
import { EVIDENCE_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

export const EvidenceLegend: React.FunctionComponent = () => (
  <div className="flex flex-col gap-3 rounded-xl bg-slate-100/70 p-4 dark:bg-slate-800/40">
    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
      What each evidence status means
    </h4>
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
      {EVIDENCE_ORDER.map((status) => (
        <div key={status} className="flex flex-col items-start gap-1">
          <dt>
            <Badge tone={EVIDENCE_TONES[status]}>
              {EVIDENCE_LABELS[status]}
            </Badge>
          </dt>
          <dd className="text-slate-600 dark:text-slate-400">
            {EVIDENCE_MEANINGS[status]}
          </dd>
        </div>
      ))}
    </dl>
  </div>
);
