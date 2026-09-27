import type { NetworkAdapter } from "@priemskiyyy/reach";

import type { NetInfoAdapterOptions } from "src/types/NetInfoAdapterOptions";
import type { NetInfoLike } from "src/types/NetInfoLike";
import type { NetInfoProfile } from "src/types/internal/NetInfoProfile";
import { getNetInfoCapabilities } from "src/utils/getNetInfoCapabilities";
import { isNativePlatform } from "src/utils/isNativePlatform";
import { readNetInfoObservation } from "src/utils/readNetInfoObservation";

/**
 * Observes React Native's NetInfo on iOS and Android, conservatively: an
 * ambiguous report stays unknown, iOS has no metering, and only NetInfo's
 * explicit `none` is offline. It borrows the NetInfo the application set up
 * and never configures it.
 *
 * @example
 * ```ts
 * import NetInfo from "@react-native-community/netinfo";
 * import { Platform } from "react-native";
 *
 * const reach = new Reach({ adapter: netInfo({ sdk: NetInfo, platform: Platform.OS }) });
 * ```
 */
export const netInfo = ({
  sdk,
  platform,
  internet = "reported",
}: NetInfoAdapterOptions): NetworkAdapter<NetInfoLike> => ({
  name: "netinfo",
  available: () => isNativePlatform(platform),
  open: (context) => {
    // Android reads the system's metering answer; iOS derives its flag from the cellular transport.
    const profile: NetInfoProfile = {
      metering: platform === "android",
      internet,
    };

    // Subscribed before the first read, so a change during that read wins over it.
    context.onDispose(
      sdk.addEventListener((state) => {
        context.emit(readNetInfoObservation(state, profile));
      }),
    );

    const initialRead = context.reserve();

    sdk
      .fetch()
      .then(
        (state) => initialRead.emit(readNetInfoObservation(state, profile)),
        initialRead.reportError,
      );

    return {
      native: sdk,
      capabilities: getNetInfoCapabilities(profile),
      refresh: async ({ emit }) => {
        emit(readNetInfoObservation(await sdk.refresh(), profile));
      },
    };
  },
});
