import type { NetInfoLike } from "src/types/NetInfoLike";

/**
 * The NetInfo module the application set up, the value of `Platform.OS`, and
 * whether NetInfo's own reachability report feeds the internet fact.
 *
 * @example
 * ```ts
 * const options: NetInfoAdapterOptions = { sdk: NetInfo, platform: Platform.OS };
 * ```
 */
export type NetInfoAdapterOptions = {
  sdk: NetInfoLike;
  /** `Platform.OS`. Only `ios` and `android` are mapped; anywhere else, the web included, the adapter is unavailable. */
  platform: string;
  /**
   * `reported`, the default, maps NetInfo's reachability into the internet
   * fact; `ignore` leaves it unsupported. Ignoring it does not stop NetInfo's
   * own reachability requests: configure those in NetInfo itself.
   */
  internet?: "reported" | "ignore";
};
