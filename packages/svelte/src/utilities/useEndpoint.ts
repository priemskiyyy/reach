import type { EndpointHandle, EndpointState } from "@priemskiyyy/reach";
import { SERVER_ENDPOINT_STATE } from "../constants/serverSnapshots.js";
import type { ReadableValue } from "../types/ReadableValue.js";
import type { SelectorOptions } from "../types/SelectorOptions.js";
import { selectValue } from "../utils/selectValue.js";
import { useSelectedValue } from "./internal/useSelectedValue.svelte.js";

/**
 * Reads an endpoint's state through `current`; with a selector, `current`
 * changes only when the selection changes. It never checks or monitors the
 * endpoint. On the server and until mounted it reads an unscoped endpoint
 * that was never checked.
 *
 * @example
 * ```ts
 * const api = useEndpoint(network.endpoint("api"));
 * const checking = useEndpoint(network.endpoint("api"), (state) => state.checking);
 * ```
 */
export function useEndpoint(
  endpoint: EndpointHandle,
): ReadableValue<EndpointState>;

export function useEndpoint<TSelected>(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => TSelected,
  options?: SelectorOptions<NoInfer<TSelected>>,
): ReadableValue<TSelected>;

export function useEndpoint(
  endpoint: EndpointHandle,
  selector: (state: EndpointState) => unknown = selectValue,
  { isEqual = Object.is }: SelectorOptions<unknown> = {},
): ReadableValue<unknown> {
  return useSelectedValue(
    () => endpoint.state,
    SERVER_ENDPOINT_STATE,
    selector,
    isEqual,
  );
}
