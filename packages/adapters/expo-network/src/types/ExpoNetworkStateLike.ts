/**
 * The part of an Expo Network state the adapter reads. Expo declares every
 * field optional, and `type` is one of its upper-case `NetworkStateType`
 * values.
 *
 * @example
 * ```ts
 * const state: ExpoNetworkStateLike = {
 *   type: "WIFI",
 *   isConnected: true,
 *   isInternetReachable: true,
 * };
 * ```
 */
export type ExpoNetworkStateLike = {
  type?: string;
  isConnected?: boolean;
  isInternetReachable?: boolean;
};
