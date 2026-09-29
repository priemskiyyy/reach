import type { EndpointHandle, EndpointState } from "@priemskiyyy/reach";
import type { ComputedRef } from "vue";

import { SERVER_ENDPOINT_STATE } from "src/constants/serverSnapshots";
import { useSelectedValue } from "src/composables/internal/useSelectedValue";
import type { SelectorOptions } from "src/types/SelectorOptions";
import { selectValue } from "src/utils/selectValue";

/**
 * Reads an endpoint's state as a read-only computed ref that changes with it; with a
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
export function useEndpoint(
  endpoint: EndpointHandle,
): ComputedRef<EndpointState>;

export function useEndpoint<TSelected>(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => TSelected,
  options?: SelectorOptions<NoInfer<TSelected>>,
): ComputedRef<TSelected>;

export function useEndpoint(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): ComputedRef<unknown> {
  return useSelectedValue(
    () => endpoint.state,
    SERVER_ENDPOINT_STATE,
    selector,
    isEqual,
  );
}
