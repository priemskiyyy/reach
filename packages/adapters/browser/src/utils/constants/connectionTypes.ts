import type { ConnectionType } from "@priemskiyyy/reach";

/** Every connection type the Network Information specification names, as Reach's own; its `unknown` reports nothing. */
export const BROWSER_CONNECTION_TYPES: Map<
  string,
  Exclude<ConnectionType, "unknown">
> = new Map([
  ["bluetooth", "bluetooth"],
  ["cellular", "cellular"],
  ["ethernet", "ethernet"],
  ["mixed", "mixed"],
  ["none", "none"],
  ["other", "other"],
  ["wifi", "wifi"],
  ["wimax", "wimax"],
]);
