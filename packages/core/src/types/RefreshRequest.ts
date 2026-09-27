import type { NetworkObservation } from "src/types/NetworkObservation";

/**
 * What a session's `refresh` receives: a signal that aborts at the refresh
 * deadline or when the session ends, and `emit`, one place reserved in the
 * source's order when the refresh began, which keeps its first report.
 * Throwing or rejecting fails the refresh.
 *
 * @example
 * ```ts
 * const refresh = async ({ signal, emit }: RefreshRequest) => {
 *   emit(toObservation(await sdk.refresh({ signal })));
 * };
 * ```
 */
export type RefreshRequest = {
  signal: AbortSignal;
  emit: (observation: NetworkObservation) => void;
};
