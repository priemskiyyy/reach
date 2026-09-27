import { ReachError } from "@priemskiyyy/reach";

import type { ExpoPlatform } from "src/types/internal/ExpoPlatform";

// Expo's web module reads the browser under other names, so the web belongs to the browser adapter.
export const getExpoPlatform = (platform: string): ExpoPlatform => {
  if (platform === "ios") {
    return platform;
  }

  if (platform === "android") {
    return platform;
  }

  throw new ReachError({
    code: "UNSUPPORTED_ENVIRONMENT",
    message: `The expo-network adapter maps iOS and Android, not ${platform}. Use the browser adapter on the web.`,
  });
};
