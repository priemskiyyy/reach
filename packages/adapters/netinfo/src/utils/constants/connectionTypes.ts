import type { ConnectionType } from "@priemskiyyy/reach";

/** Every NetInfo state type but `unknown`, as Reach's own; NetInfo reports one primary type, never a set. */
export const NETINFO_CONNECTION_TYPES: Map<
  string,
  Exclude<ConnectionType, "unknown">
> = new Map([
  ["none", "none"],
  ["cellular", "cellular"],
  ["wifi", "wifi"],
  ["bluetooth", "bluetooth"],
  ["ethernet", "ethernet"],
  ["wimax", "wimax"],
  ["vpn", "vpn"],
  ["other", "other"],
]);
