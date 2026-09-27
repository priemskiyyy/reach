import type { ExpoNetworkLike } from "src/types/ExpoNetworkLike";

/**
 * The `expo-network` module the application imports and the value of
 * `Platform.OS`.
 *
 * @example
 * ```ts
 * const options: ExpoNetworkAdapterOptions = { sdk: Network, platform: Platform.OS };
 * ```
 */
export type ExpoNetworkAdapterOptions = {
  sdk: ExpoNetworkLike;
  /** Only `ios` and `android` are mapped; the web belongs to the browser adapter. */
  platform: string;
};
