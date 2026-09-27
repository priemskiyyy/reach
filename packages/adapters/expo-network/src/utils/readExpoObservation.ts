import type { NetworkObservation } from "@priemskiyyy/reach";

import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";
import type { ExpoPlatform } from "src/types/internal/ExpoPlatform";
import type { ExpoReport } from "src/types/internal/ExpoReport";
import { readExpoInternet } from "src/utils/readExpoInternet";
import { readExpoPath } from "src/utils/readExpoPath";
import { readExpoStatus } from "src/utils/readExpoStatus";
import { readExpoType } from "src/utils/readExpoType";
import { trustsNoPath } from "src/utils/trustsNoPath";

/** One complete report from an Expo state; Expo reports no transport set, cost or data preference. */
export const readExpoObservation = (
  state: ExpoNetworkStateLike,
  platform: ExpoPlatform,
  report: ExpoReport,
): NetworkObservation => {
  const path = readExpoPath(state, trustsNoPath(platform, report));

  return {
    connection: {
      status: readExpoStatus(path),
      type: readExpoType(path),
      transports: { status: "unsupported" },
    },
    internet: { status: readExpoInternet(state, path, platform) },
    cost: {
      metered: { status: "unsupported" },
      expensive: { status: "unsupported" },
    },
    preferences: {
      constrained: { status: "unsupported" },
      saveData: { status: "unsupported" },
    },
  };
};
