import type { NetworkObservation } from "@priemskiyyy/reach";

import type { NetInfoStateLike } from "src/types/NetInfoStateLike";
import type { NetInfoProfile } from "src/types/internal/NetInfoProfile";
import { NETINFO_CONNECTION_TYPES } from "src/utils/constants/connectionTypes";
import { readNetInfoInternet } from "src/utils/readNetInfoInternet";
import { readNetInfoMetered } from "src/utils/readNetInfoMetered";
import { readNetInfoStatus } from "src/utils/readNetInfoStatus";

/** One complete report from a NetInfo state; NetInfo reports no transport set, expense or data preference. */
export const readNetInfoObservation = (
  state: NetInfoStateLike,
  profile: NetInfoProfile,
): NetworkObservation => {
  const type = NETINFO_CONNECTION_TYPES.get(state.type);

  return {
    connection: {
      status: readNetInfoStatus(state, type),
      type:
        type === undefined
          ? { status: "unknown" }
          : { status: "current", value: type, basis: "native-path" },
      transports: { status: "unsupported" },
    },
    internet: { status: readNetInfoInternet(state, type, profile) },
    cost: {
      metered: readNetInfoMetered(state, profile),
      expensive: { status: "unsupported" },
    },
    preferences: {
      constrained: { status: "unsupported" },
      saveData: { status: "unsupported" },
    },
  };
};
