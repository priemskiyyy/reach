import type { FieldCapability, NetworkCapabilities } from "@priemskiyyy/reach";

import type { NetworkInformationLike } from "src/types/NetworkInformationLike";
import {
  ONLINE_HINT_FIELD,
  UNSUPPORTED_FIELD,
} from "src/utils/constants/capabilities";

const getConnectionField = (
  connection: NetworkInformationLike | null,
  isPresent: (connection: NetworkInformationLike) => boolean,
  basis: "browser-hint" | "user-data-preference",
): FieldCapability => {
  if (connection === null) {
    return UNSUPPORTED_FIELD;
  }

  if (!isPresent(connection)) {
    return UNSUPPORTED_FIELD;
  }

  return {
    support: "supported",
    // Without its change event, a value is read only when something else is.
    notifications:
      typeof connection.addEventListener === "function" ? "complete" : "none",
    bases: [basis],
  };
};

/** What this browser can report, detected property by property when the session opens. */
export const getBrowserCapabilities = (
  connection: NetworkInformationLike | null,
): NetworkCapabilities => ({
  fields: {
    "connection.status": ONLINE_HINT_FIELD,
    "connection.type": getConnectionField(
      connection,
      (candidate) => "type" in candidate,
      "browser-hint",
    ),
    "connection.transports": UNSUPPORTED_FIELD,
    "internet.status": UNSUPPORTED_FIELD,
    "cost.metered": UNSUPPORTED_FIELD,
    "cost.expensive": UNSUPPORTED_FIELD,
    "preferences.constrained": UNSUPPORTED_FIELD,
    "preferences.saveData": getConnectionField(
      connection,
      (candidate) => typeof candidate.saveData === "boolean",
      "user-data-preference",
    ),
  },
  ownership: "owned",
  routeIdentity: "coarse",
  upstreamActivity: "none",
});
