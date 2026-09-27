import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";

/**
 * The part of the `expo-network` module the adapter calls. The IP address
 * and airplane mode helpers are never called: the web one asks a third-party
 * service for the public address.
 *
 * @example
 * ```ts
 * import * as Network from "expo-network";
 *
 * const sdk: ExpoNetworkLike = Network;
 * ```
 */
export type ExpoNetworkLike = {
  addNetworkStateListener: (
    listener: (state: ExpoNetworkStateLike) => void,
  ) => { remove: () => void };
  getNetworkStateAsync: () => Promise<ExpoNetworkStateLike>;
};
