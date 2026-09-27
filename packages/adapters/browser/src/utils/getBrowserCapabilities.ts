import type { FieldCapability, NetworkCapabilities } from "@priemskiyyy/reach";

import type { NetworkInformationLike } from "src/types/NetworkInformationLike";
import {
  ONLINE_HINT_FIELD,
  UNSUPPORTED_FIELD,
} from "src/utils/constants/capabilities";

// A Network Information property reports its every change through the change event.
const getConnectionField = (
  present: boolean,
  basis: "browser-hint" | "user-data-preference",
): FieldCapability => {
  if (!present) {
    return UNSUPPORTED_FIELD;
  }

  return { support: "supported", notifications: "complete", bases: [basis] };
};

/** What this browser can report, detected property by property when the session opens. */
export const getBrowserCapabilities = (
  connection: NetworkInformationLike | null,
): NetworkCapabilities => ({
  "connection.status": ONLINE_HINT_FIELD,
  "connection.type": getConnectionField(
    connection?.type !== undefined,
    "browser-hint",
  ),
  "connection.transports": UNSUPPORTED_FIELD,
  "internet.status": UNSUPPORTED_FIELD,
  "cost.metered": UNSUPPORTED_FIELD,
  "cost.expensive": UNSUPPORTED_FIELD,
  "preferences.constrained": UNSUPPORTED_FIELD,
  "preferences.saveData": getConnectionField(
    connection?.saveData !== undefined,
    "user-data-preference",
  ),
});
