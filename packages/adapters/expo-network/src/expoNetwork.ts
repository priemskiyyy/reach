import type { NetworkAdapter } from "@priemskiyyy/reach";

import type { ExpoNetworkAdapterOptions } from "src/types/ExpoNetworkAdapterOptions";
import type { ExpoNetworkLike } from "src/types/ExpoNetworkLike";
import { getExpoCapabilities } from "src/utils/getExpoCapabilities";
import { getExpoPlatform } from "src/utils/getExpoPlatform";
import { isNativePlatform } from "src/utils/isNativePlatform";
import { readExpoObservation } from "src/utils/readExpoObservation";

/**
 * Observes Expo Network on iOS and Android, per platform: iOS reports the
 * native path but not the internet, Android reports its validated network,
 * and neither reports cost, so a metering condition stays unknown.
 *
 * @example
 * ```ts
 * import * as Network from "expo-network";
 * import { Platform } from "react-native";
 *
 * const reach = new Reach({ adapter: expoNetwork({ sdk: Network, platform: Platform.OS }) });
 * ```
 */
export const expoNetwork = (
  options: ExpoNetworkAdapterOptions,
): NetworkAdapter<ExpoNetworkLike> => ({
  name: "expo-network",
  available: () => isNativePlatform(options.platform),
  open: (context) => {
    const platform = getExpoPlatform(options.platform);
    const { sdk } = options;

    // Subscribed before the first read, so a change during that read wins over it.
    const subscription = sdk.addNetworkStateListener((state) => {
      context.emit(readExpoObservation(state, platform, "event"));
    });

    context.onDispose(() => {
      subscription.remove();
    });

    const initialRead = context.reserve();

    sdk
      .getNetworkStateAsync()
      .then(
        (state) =>
          initialRead.emit(readExpoObservation(state, platform, "read")),
        initialRead.reportError,
      );

    return {
      native: sdk,
      capabilities: getExpoCapabilities(platform),
      refresh: async ({ emit }) => {
        emit(
          readExpoObservation(
            await sdk.getNetworkStateAsync(),
            platform,
            "read",
          ),
        );
      },
    };
  },
});
