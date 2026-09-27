import type { NetworkCapabilities } from "@priemskiyyy/reach";

import type { NetInfoProfile } from "src/types/internal/NetInfoProfile";
import {
  METERING_FIELD,
  NATIVE_PATH_FIELD,
  REACHABILITY_FIELD,
  UNSUPPORTED_FIELD,
} from "src/utils/constants/capabilities";

/** What NetInfo reports on this platform, with the options the application chose. */
export const getNetInfoCapabilities = ({
  platform,
  internet,
}: NetInfoProfile): NetworkCapabilities => ({
  fields: {
    "connection.status": NATIVE_PATH_FIELD,
    "connection.type": NATIVE_PATH_FIELD,
    "connection.transports": UNSUPPORTED_FIELD,
    "internet.status":
      internet === "reported" ? REACHABILITY_FIELD : UNSUPPORTED_FIELD,
    "cost.metered": platform === "android" ? METERING_FIELD : UNSUPPORTED_FIELD,
    "cost.expensive": UNSUPPORTED_FIELD,
    "preferences.constrained": UNSUPPORTED_FIELD,
    "preferences.saveData": UNSUPPORTED_FIELD,
  },
  // The application owns the NetInfo singleton and may share it.
  ownership: "borrowed",
  routeIdentity: "coarse",
  // NetInfo sends reachability requests of its own, whatever Reach does.
  upstreamActivity: "provider-controlled",
});
