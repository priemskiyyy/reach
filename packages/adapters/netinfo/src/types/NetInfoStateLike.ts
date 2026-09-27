/**
 * The part of a NetInfo state the adapter reads. Wi-Fi names, addresses and
 * carriers stay on the provider's object and are never read.
 *
 * @example
 * ```ts
 * const state: NetInfoStateLike = {
 *   type: "wifi",
 *   isConnected: true,
 *   isInternetReachable: null,
 *   details: { isConnectionExpensive: false },
 * };
 * ```
 */
export type NetInfoStateLike = {
  type: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  details: { isConnectionExpensive?: boolean } | null;
};
