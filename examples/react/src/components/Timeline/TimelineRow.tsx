import type React from "react";

import {
  EVENT_LABELS,
  SOURCE_LABELS,
} from "example-shared/darkroom/network/constants/labels";
import type { TimelineEntry } from "example-shared/darkroom/runtime/types/TimelineEntry";
import { formatClockTime } from "example-shared/formatting/formatClockTime";
import { EVENT_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

type TimelineRowProps = { entry: TimelineEntry };

const formatDetail = ({ endpoint, check, reason }: TimelineEntry) =>
  [endpoint, check === null ? null : `#${check}`, reason]
    .filter((part) => part !== null)
    .join(" · ");

export const TimelineRow: React.FunctionComponent<TimelineRowProps> = ({
  entry,
}) => (
  <li className="flex items-center justify-between gap-3 py-2 text-sm">
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <Badge tone={EVENT_TONES[entry.type]}>{EVENT_LABELS[entry.type]}</Badge>
      <span className="font-mono text-xs text-slate-500">
        {formatDetail(entry)}
      </span>
    </span>
    <span className="flex shrink-0 flex-col items-end font-mono text-xs text-slate-500">
      <span>{formatClockTime(entry.timestamp)}</span>
      <span>
        {SOURCE_LABELS[entry.source]} · gen {entry.networkGeneration}
      </span>
    </span>
  </li>
);
