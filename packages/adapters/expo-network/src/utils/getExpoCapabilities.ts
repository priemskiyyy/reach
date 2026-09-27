import type { NetworkCapabilities } from "@priemskiyyy/reach";

import type { ExpoPlatform } from "src/types/internal/ExpoPlatform";
import {
  NATIVE_PATH_FIELD,
  NO_PATH_FIELD,
  UNSUPPORTED_FIELD,
  VALIDATION_FIELD,
} from "src/utils/constants/capabilities";

/** What Expo Network reports on this platform. */
export const getExpoCapabilities = (
  platform: ExpoPlatform,
): NetworkCapabilities => ({
  "connection.status": NATIVE_PATH_FIELD,
  "connection.type": NATIVE_PATH_FIELD,
  "connection.transports": UNSUPPORTED_FIELD,
  "internet.status": platform === "android" ? VALIDATION_FIELD : NO_PATH_FIELD,
  "cost.metered": UNSUPPORTED_FIELD,
  "cost.expensive": UNSUPPORTED_FIELD,
  "preferences.constrained": UNSUPPORTED_FIELD,
  "preferences.saveData": UNSUPPORTED_FIELD,
});
