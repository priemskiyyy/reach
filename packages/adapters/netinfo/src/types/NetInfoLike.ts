import type { NetInfoStateLike } from "src/types/NetInfoStateLike";

/**
 * The part of NetInfo's default export the adapter calls. The adapter never
 * calls `configure`: the application owns NetInfo's global configuration.
 *
 * @example
 * ```ts
 * import NetInfo from "@react-native-community/netinfo";
 *
 * const sdk: NetInfoLike = NetInfo;
 * ```
 */
export type NetInfoLike = {
  addEventListener: (listener: (state: NetInfoStateLike) => void) => () => void;
  fetch: () => Promise<NetInfoStateLike>;
  refresh: () => Promise<NetInfoStateLike>;
};
