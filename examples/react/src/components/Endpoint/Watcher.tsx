import { useEndpoint } from "@priemskiyyy/reach-react";
import type React from "react";

import { ENDPOINT_STATUS_LABELS } from "example-shared/darkroom/network/constants/labels";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { ENDPOINT_STATUS_TONES } from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";

type WatcherProps = { runtime: DarkroomRuntime; number: number };

/** One more component reading the API's state, which never asks for a check. */
export const Watcher: React.FunctionComponent<WatcherProps> = ({
  runtime,
  number,
}) => {
  const status = useEndpoint(runtime.api, (state) => state.status);

  return (
    <li>
      <Badge tone={ENDPOINT_STATUS_TONES[status]}>
        Watcher {number}: {ENDPOINT_STATUS_LABELS[status]}
      </Badge>
    </li>
  );
};
