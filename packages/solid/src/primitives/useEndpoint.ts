import type { EndpointHandle, EndpointState } from "@priemskiyyy/reach";
import type { Accessor } from "solid-js";

import { SERVER_ENDPOINT_STATE } from "src/constants/serverSnapshots";
import { useSelectedValue } from "src/primitives/internal/useSelectedValue";
import type { SelectorOptions } from "src/types/SelectorOptions";
import { selectValue } from "src/utils/selectValue";

/**
 * Reads an endpoint's state as an accessor that changes with it; with a
 * selector, only when the selection changes. It never checks or monitors
 * the endpoint. On the server and until mounted it reads an unscoped
 * endpoint that was never checked.
 *
 * @example
 * ```ts
 * const api = useEndpoint(network.endpoint("api"));
 * const checking = useEndpoint(network.endpoint("api"), (state) => state.checking);
 * ```
 */
export function useEndpoint(endpoint: EndpointHandle): Accessor<EndpointState>;

export function useEndpoint<TSelected>(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => TSelected,
  options?: SelectorOptions<NoInfer<TSelected>>,
): Accessor<TSelected>;

export function useEndpoint(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): Accessor<unknown> {
  return useSelectedValue(
    () => endpoint.state,
    SERVER_ENDPOINT_STATE,
    selector,
    isEqual,
  );
}
