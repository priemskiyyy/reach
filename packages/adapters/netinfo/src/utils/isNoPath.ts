import type { ConnectionType } from "@priemskiyyy/reach";

import type { NetInfoStateLike } from "src/types/NetInfoStateLike";

/** NetInfo's explicit `none` with a disconnected state: the one report trusted as no path. */
export const isNoPath = (
  { isConnected }: NetInfoStateLike,
  type: Exclude<ConnectionType, "unknown"> | undefined,
) => {
  if (type !== "none") {
    return false;
  }

  return isConnected === false;
};
