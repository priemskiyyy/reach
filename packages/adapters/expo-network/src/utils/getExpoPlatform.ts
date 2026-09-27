import type { ExpoPlatform } from "src/types/internal/ExpoPlatform";

/** The platform to map; `available()` admitted only iOS and Android. */
export const getExpoPlatform = (platform: string): ExpoPlatform => {
  if (platform === "android") {
    return "android";
  }

  return "ios";
};
