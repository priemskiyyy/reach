import type { EndpointHandle, EndpointState } from "@priemskiyyy/reach";

import { SERVER_ENDPOINT_STATE } from "src/constants/serverSnapshots";
import { useSelectedValue } from "src/hooks/internal/useSelectedValue";
import type { SelectorOptions } from "src/types/SelectorOptions";
import { selectValue } from "src/utils/selectValue";

/**
 * Reads an endpoint's state and renders again when it changes; with a
 * selector, only when the selection changes. It never checks or monitors
 * the endpoint. On the server and the hydrating render it reads an unscoped
 * endpoint that was never checked.
 *
 * @example
 * ```ts
 * const api = useEndpoint(network.endpoint("api"));
 * const checking = useEndpoint(network.endpoint("api"), (state) => state.checking);
 * ```
 */
export function useEndpoint(endpoint: EndpointHandle): EndpointState;

export function useEndpoint<TSelected>(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => TSelected,
  options?: SelectorOptions<TSelected>,
): TSelected;

export function useEndpoint(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): unknown {
  return useSelectedValue(
    endpoint.state,
    SERVER_ENDPOINT_STATE,
    selector,
    isEqual,
  );
}
