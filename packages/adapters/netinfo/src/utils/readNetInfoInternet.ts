import type { ConnectionType, FieldObservation } from "@priemskiyyy/reach";

import type { NetInfoStateLike } from "src/types/NetInfoStateLike";
import type { NetInfoProfile } from "src/types/internal/NetInfoProfile";
import { isNoPath } from "src/utils/isNoPath";

/**
 * Online when NetInfo reports reachability, offline only for its explicit
 * `none`. A false reachability while connected can be a failed check or one
 * NetInfo skipped, so it stays unknown.
 */
export const readNetInfoInternet = (
  state: NetInfoStateLike,
  type: Exclude<ConnectionType, "unknown"> | undefined,
  { internet }: NetInfoProfile,
): FieldObservation<"online" | "offline"> => {
  if (internet === "ignore") {
    return { status: "unsupported" };
  }

  if (isNoPath(state, type)) {
    return { status: "current", value: "offline", basis: "native-path" };
  }

  if (state.isInternetReachable === true) {
    return { status: "current", value: "online", basis: "provider-report" };
  }

  if (state.isInternetReachable === false) {
    return { status: "unknown", reason: "source-ambiguous" };
  }

  return { status: "unknown" };
};
