/**
 * What one check receives: a signal that aborts at the check's deadline or
 * once the network, scope, session or its callers moved on, and the scope key
 * it checks for. Test `signal.aborted` between the steps of a check in
 * several steps, such as fetching a token first.
 *
 * @example
 * ```ts
 * const check = async ({ signal, scope }: ProbeContext): Promise<ProbeResult> => {
 *   const token = await session.tokenFor(scope);
 *
 *   signal.throwIfAborted();
 *
 *   const ready = await api.ready({ token, signal });
 *
 *   return { verdict: ready ? "pass" : "fail", response: "received" };
 * };
 * ```
 */
export type ProbeContext = {
  signal: AbortSignal;
  /** The scope key the check runs for, or `null` for an unscoped endpoint. */
  scope: string | null;
};
