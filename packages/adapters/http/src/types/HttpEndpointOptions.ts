import type { EndpointDefinition, ProbeContext } from "@priemskiyyy/reach";

/**
 * Options for `http()`: an endpoint definition whose check is your own
 * client. The client owns the address, authentication, headers, caching and
 * parsing; Reach owns when it runs, its deadline and what its answer means.
 *
 * @example
 * ```ts
 * const options: HttpEndpointOptions<{ ready: boolean }> = {
 *   request: ({ signal }) => api.health.get({ signal }),
 *   test: ({ ready }) => ready,
 *   staleAfter: 30_000,
 * };
 * ```
 */
export type HttpEndpointOptions<TData> = Omit<EndpointDefinition, "check"> & {
  /**
   * Sends one check through your client and resolves with the parsed
   * response. Reject when no usable answer arrived; pass `signal` on, so a
   * timed-out or superseded check stops sending. `scope` is the key of a
   * scoped endpoint, or `null`.
   */
  request: (context: ProbeContext) => TData | PromiseLike<TData>;
  /**
   * Whether the parsed answer means the endpoint is available. Without it,
   * any answer does. A test that throws is the check's own error, never an
   * unavailable endpoint.
   */
  test?: (data: TData) => boolean | PromiseLike<boolean>;
};
