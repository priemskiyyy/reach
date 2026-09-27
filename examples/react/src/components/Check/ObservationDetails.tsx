import type { EndpointObservation } from "@priemskiyyy/reach";
import type React from "react";

import {
  RESPONSE_LABELS,
  VERDICT_LABELS,
} from "example-shared/darkroom/network/constants/labels";
import { formatClockTime } from "example-shared/formatting/formatClockTime";
import { formatDuration } from "example-shared/formatting/formatDuration";

type ObservationDetailsProps = { observation: EndpointObservation };

export const ObservationDetails: React.FunctionComponent<
  ObservationDetailsProps
> = ({ observation }) => {
  const rows = [
    { label: "Check", value: `#${observation.check}` },
    { label: "Verdict", value: VERDICT_LABELS[observation.verdict] },
    { label: "Answer", value: RESPONSE_LABELS[observation.response] },
    {
      label: "Took",
      value: formatDuration(observation.completedAt - observation.startedAt),
    },
    { label: "Finished", value: formatClockTime(observation.completedAt) },
    { label: "Generation", value: `${observation.networkGeneration}` },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-slate-100/70 p-4 text-sm sm:grid-cols-3 dark:bg-slate-800/40">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 flex-col">
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            {label}
          </dt>
          <dd className="truncate font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
};
