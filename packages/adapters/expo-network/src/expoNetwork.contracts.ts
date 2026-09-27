// Typechecked, never run: Expo Network's real module and state satisfy the
// structural types the adapter uses, so the adapter never imports it.
import type { NetworkState } from "expo-network";
import * as Network from "expo-network";

import { expoNetwork } from "src/expoNetwork";
import type { ExpoNetworkLike } from "src/types/ExpoNetworkLike";
import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";

declare const state: NetworkState;

export const sdk: ExpoNetworkLike = Network;

export const read: ExpoNetworkStateLike = state;

export const adapter = expoNetwork({ sdk: Network, platform: "android" });

// @ts-expect-error The expo-network module is required; Reach never imports it.
export const withoutSdk = expoNetwork({ platform: "ios" });

// @ts-expect-error The platform decides the mapping, so it is never guessed.
export const withoutPlatform = expoNetwork({ sdk: Network });
