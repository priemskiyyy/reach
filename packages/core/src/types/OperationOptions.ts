/**
 * Options for an operation that waits: `signal` cancels this caller's wait
 * alone, never the shared work other callers still wait on.
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * const result = api.check({ signal: controller.signal });
 * ```
 */
export type OperationOptions = {
  signal?: AbortSignal;
};
