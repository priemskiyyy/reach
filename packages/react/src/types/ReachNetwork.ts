import type {
  NetworkState,
  ObservableValue,
  RuntimeLease,
} from "@priemskiyyy/reach";

/**
 * What the provider and `useNetwork` need from a Reach: its state and a
 * lease. Any `Reach` fits, whatever its native object and endpoint names.
 *
 * @example
 * ```ts
 * const network: ReachNetwork = new Reach({ adapter: browser() });
 * ```
 */
export type ReachNetwork = {
  state: ObservableValue<NetworkState>;
  start: () => RuntimeLease;
};
