import type { ExpoPlatform } from "src/types/internal/ExpoPlatform";
import type { ExpoReport } from "src/types/internal/ExpoReport";

/**
 * Android answers `NONE` only without an active network. iOS's one-shot read
 * answers the same tuple when its temporary monitor times out, so only its
 * live path event is trusted with no path.
 */
export const trustsNoPath = (platform: ExpoPlatform, report: ExpoReport) => {
  if (platform === "android") {
    return true;
  }

  return report === "event";
};
