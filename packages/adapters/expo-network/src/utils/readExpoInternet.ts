import type { FieldObservation } from "@priemskiyyy/reach";

import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";
import type { ExpoPath } from "src/types/internal/ExpoPath";
import type { ExpoPlatform } from "src/types/internal/ExpoPlatform";

/**
 * Offline only for a trusted no path. Android's reachability is a validated
 * network, so it is online when true and ambiguous when false; iOS copies the
 * path into it, which says nothing about the internet.
 */
export const readExpoInternet = (
  { isInternetReachable }: ExpoNetworkStateLike,
  path: ExpoPath,
  platform: ExpoPlatform,
): FieldObservation<"online" | "offline"> => {
  if (path.kind === "no-path") {
    return { status: "current", value: "offline", basis: "native-path" };
  }

  if (path.kind === "ambiguous") {
    return { status: "unknown", reason: "source-ambiguous" };
  }

  if (path.kind === "unreported") {
    return { status: "unknown" };
  }

  if (platform === "ios") {
    return { status: "unknown" };
  }

  if (isInternetReachable === true) {
    return { status: "current", value: "online", basis: "native-validation" };
  }

  // Missing internet capability, validation and a suspended network all answer false.
  if (isInternetReachable === false) {
    return { status: "unknown", reason: "source-ambiguous" };
  }

  return { status: "unknown" };
};
