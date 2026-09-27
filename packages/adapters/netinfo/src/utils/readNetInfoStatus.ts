import type { ConnectionType, FieldObservation } from "@priemskiyyy/reach";

import type { NetInfoStateLike } from "src/types/NetInfoStateLike";
import { isNoPath } from "src/utils/isNoPath";

/**
 * Connected only for a usable type NetInfo says is connected, disconnected
 * only for its explicit no path; every other pairing, such as an unknown type
 * with `false`, cannot tell a failure from a skipped check and stays unknown.
 */
export const readNetInfoStatus = (
  state: NetInfoStateLike,
  type: Exclude<ConnectionType, "unknown"> | undefined,
): FieldObservation<"connected" | "disconnected"> => {
  if (isNoPath(state, type)) {
    return { status: "current", value: "disconnected", basis: "native-path" };
  }

  if (type === "none") {
    return { status: "unknown", reason: "source-ambiguous" };
  }

  if (state.isConnected === false) {
    return { status: "unknown", reason: "source-ambiguous" };
  }

  if (type === undefined) {
    return { status: "unknown" };
  }

  if (state.isConnected === true) {
    return { status: "current", value: "connected", basis: "native-path" };
  }

  return { status: "unknown" };
};
