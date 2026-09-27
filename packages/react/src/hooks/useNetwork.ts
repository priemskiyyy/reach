import { ReachError, UNKNOWN_NETWORK_STATE } from "@priemskiyyy/reach";
import type { NetworkState } from "@priemskiyyy/reach";
import { useContext } from "react";

import { ReachContext } from "src/context/ReachContext";
import { useSelectedValue } from "src/hooks/internal/useSelectedValue";
import type { ReachNetwork } from "src/types/ReachNetwork";
import type { SelectorOptions } from "src/types/SelectorOptions";
import { selectValue } from "src/utils/selectValue";

/**
 * Reads the network state, of the given Reach or the provider's, and renders
 * again when it changes; with a selector, only when the selection changes.
 * It observes only: it never starts the runtime. On the server and the
 * hydrating render it reads `UNKNOWN_NETWORK_STATE`.
 *
 * @example
 * ```ts
 * const state = useNetwork();
 * const status = useNetwork(network, (state) => state.connection.status);
 * ```
 */
export function useNetwork(network?: ReachNetwork): NetworkState;

export function useNetwork<TSelected>(
  network: ReachNetwork,
  selector: (state: NetworkState) => TSelected,
  options?: SelectorOptions<TSelected>,
): TSelected;

export function useNetwork(
  network?: ReachNetwork,
  selector: (state: NetworkState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): unknown {
  const provided = useContext(ReachContext);
  const source = network ?? provided;

  if (source === undefined) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: "useNetwork needs a Reach, passed in or from a ReachProvider.",
    });
  }

  return useSelectedValue(
    source.state,
    UNKNOWN_NETWORK_STATE,
    selector,
    isEqual,
  );
}
