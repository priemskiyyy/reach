/** iOS and Android are the platforms this adapter maps; the web belongs to the browser adapter. */
export const isNativePlatform = (platform: string) => {
  if (platform === "ios") {
    return true;
  }

  return platform === "android";
};
