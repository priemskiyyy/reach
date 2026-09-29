import { ReachError, UNKNOWN_NETWORK_STATE } from "@priemskiyyy/reach";
import type { NetworkState } from "@priemskiyyy/reach";
import { getContext } from "svelte";
import { REACH_CONTEXT } from "../context/ReachContext.js";
import type { ReachNetwork } from "../types/ReachNetwork.js";
import type { ReadableValue } from "../types/ReadableValue.js";
import type { SelectorOptions } from "../types/SelectorOptions.js";
import { selectValue } from "../utils/selectValue.js";
import { useSelectedValue } from "./internal/useSelectedValue.svelte.js";

/**
 * Reads the network state, of the given Reach or the provider's, through
 * `current`; with a selector, `current` changes only when the selection
 * changes. It observes only: it never starts the runtime. On the server and
 * until mounted it reads `UNKNOWN_NETWORK_STATE`.
 *
 * @example
 * ```ts
 * const state = useNetwork();
 * const status = useNetwork(network, (state) => state.connection.status);
 * ```
 */
export function useNetwork(network?: ReachNetwork): ReadableValue<NetworkState>;

export function useNetwork<TSelected>(
  network: ReachNetwork,
  selector: (state: NetworkState) => TSelected,
  options?: SelectorOptions<NoInfer<TSelected>>,
): ReadableValue<TSelected>;

export function useNetwork(
  network?: ReachNetwork,
  selector: (state: NetworkState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): ReadableValue<unknown> {
  const provided = getContext<ReadableValue<ReachNetwork> | undefined>(
    REACH_CONTEXT,
  );

  const resolve = network === undefined ? provided : { current: network };

  if (resolve === undefined) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: "useNetwork needs a Reach, passed in or from a ReachProvider.",
    });
  }

  return useSelectedValue(
    () => resolve.current.state,
    UNKNOWN_NETWORK_STATE,
    selector,
    isEqual,
  );
}
