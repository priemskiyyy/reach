import { ReachError, UNKNOWN_NETWORK_STATE } from "@priemskiyyy/reach";
import type { NetworkState } from "@priemskiyyy/reach";
import { inject } from "vue";
import type { ComputedRef } from "vue";

import { REACH_CONTEXT } from "src/context/ReachContext";
import { useSelectedValue } from "src/composables/internal/useSelectedValue";
import type { ReachNetwork } from "src/types/ReachNetwork";
import type { SelectorOptions } from "src/types/SelectorOptions";
import { selectValue } from "src/utils/selectValue";

/**
 * Reads the network state, of the given Reach or the provider's, as a
 * read-only computed ref that changes with it; with a selector, only when the selection
 * changes. It observes only: it never starts the runtime. On the server and
 * until mounted it reads `UNKNOWN_NETWORK_STATE`.
 *
 * @example
 * ```ts
 * const state = useNetwork();
 * const status = useNetwork(network, (state) => state.connection.status);
 * ```
 */
export function useNetwork(network?: ReachNetwork): ComputedRef<NetworkState>;

export function useNetwork<TSelected>(
  network: ReachNetwork,
  selector: (state: NetworkState) => TSelected,
  options?: SelectorOptions<NoInfer<TSelected>>,
): ComputedRef<TSelected>;

export function useNetwork(
  network?: ReachNetwork,
  selector: (state: NetworkState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): ComputedRef<unknown> {
  const provided = inject(REACH_CONTEXT, undefined);
  const resolve = network === undefined ? provided : { value: network };

  if (resolve === undefined) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: "useNetwork needs a Reach, passed in or from a ReachProvider.",
    });
  }

  return useSelectedValue(
    () => resolve.value.state,
    UNKNOWN_NETWORK_STATE,
    selector,
    isEqual,
  );
}
