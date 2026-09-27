import type { RuntimeStatus } from "@priemskiyyy/reach";

import { RUNTIME_LABELS } from "example-shared/darkroom/network/constants/labels";

export const formatRuntimeStatus = (status: RuntimeStatus) => {
  if (status.state === "running" && status.refreshing) {
    return "Refreshing";
  }

  return RUNTIME_LABELS[status.state];
};
