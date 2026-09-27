import type { Transport } from "@priemskiyyy/reach";

/**
 * Every Expo `NetworkStateType` that names a transport. `NONE` and `UNKNOWN`
 * are read with the connection state, never as a type on their own.
 */
export const EXPO_CONNECTION_TYPES: Map<string, Transport> = new Map([
  ["WIFI", "wifi"],
  ["CELLULAR", "cellular"],
  ["ETHERNET", "ethernet"],
  ["BLUETOOTH", "bluetooth"],
  ["WIMAX", "wimax"],
  ["VPN", "vpn"],
  ["OTHER", "other"],
]);
