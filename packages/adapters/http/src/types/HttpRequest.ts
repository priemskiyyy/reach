/**
 * What `request` receives for one check: a signal that aborts at the
 * deadline, on supersession and on disposal, the scope key the check runs
 * for, and whether the check is still current, for a request in several
 * steps.
 *
 * @example
 * ```ts
 * const request = ({ signal, scope }: HttpRequest) => api.health.get({ account: scope, signal });
 * ```
 */
export type HttpRequest = {
  signal: AbortSignal;
  /** The scope key, or `null` for an unscoped endpoint. */
  scope: string | null;
  /** `false` once the network, scope, session or endpoint moved on from this check. */
  isCurrent: () => boolean;
};
