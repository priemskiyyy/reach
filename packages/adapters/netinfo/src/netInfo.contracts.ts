// Typechecked, never run: NetInfo's real module and state satisfy the
// structural types the adapter uses, so the adapter never imports NetInfo.
import type { NetInfoState } from "@react-native-community/netinfo";
import NetInfo from "@react-native-community/netinfo";

import { netInfo } from "src/netInfo";
import type { NetInfoLike } from "src/types/NetInfoLike";
import type { NetInfoStateLike } from "src/types/NetInfoStateLike";

declare const state: NetInfoState;

export const sdk: NetInfoLike = NetInfo;

export const read: NetInfoStateLike = state;

export const adapter = netInfo({ sdk: NetInfo, platform: "ios" });

// @ts-expect-error The NetInfo module is required; Reach never imports it.
export const withoutSdk = netInfo({ platform: "android" });

export const ignoring = netInfo({
  sdk: NetInfo,
  platform: "android",
  // @ts-expect-error Reachability is reported or ignored, never disabled from here.
  internet: "disabled",
});
