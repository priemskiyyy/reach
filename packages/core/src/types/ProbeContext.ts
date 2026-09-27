import type { NetworkState } from "src/types/NetworkState";

/**
 * What one check receives, captured when it began: a signal that aborts at the
 * deadline or when the check stops mattering, the scope it checks for, the
 * network snapshot, and `isCurrent`, to test before each side effect.
 *
 * @example
 * ```ts
 * const check = async ({ signal, scope, isCurrent }: ProbeContext) => {
 *   const token = await session.tokenFor(scope?.key);
 *
 *   if (!isCurrent()) {
 *     return { verdict: "inconclusive", response: "not-observed" } satisfies ProbeResult;
 *   }
 *
 *   return (await api.ready({ token, signal }))
 *     ? ({ verdict: "pass", response: "received" } satisfies ProbeResult)
 *     : ({ verdict: "fail", response: "received" } satisfies ProbeResult);
 * };
 * ```
 */
export type ProbeContext = {
  signal: AbortSignal;
  /** The scope key the check runs for, or `null` for an unscoped endpoint. */
  scope: { key: string } | null;
  network: NetworkState;
  /** When the check times out, in milliseconds on the Reach clock's monotonic time. */
  deadline: number;
  /** `false` once the network, scope, session or endpoint moved on from this check. */
  isCurrent: () => boolean;
};
