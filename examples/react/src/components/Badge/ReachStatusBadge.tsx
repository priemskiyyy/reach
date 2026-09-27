import type React from "react";

import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { formatRuntimeStatus } from "example-shared/formatting/formatRuntimeStatus";
import { RUNTIME_TONES } from "example-shared/ui/constants/tones";
import { dotStyles } from "example-shared/ui/styles/dotStyles";
import { Badge } from "src/components/Badge/Badge";
import { useObservable } from "src/hooks/useObservable";

type ReachStatusBadgeProps = { runtime: DarkroomRuntime };

export const ReachStatusBadge: React.FunctionComponent<
  ReachStatusBadgeProps
> = ({ runtime }) => {
  const status = useObservable(runtime.reach.status);
  const tone = RUNTIME_TONES[status.state];

  return (
    <Badge tone={tone}>
      <span aria-hidden="true" className={dotStyles({ tone })} />
      {formatRuntimeStatus(status)}
    </Badge>
  );
};
