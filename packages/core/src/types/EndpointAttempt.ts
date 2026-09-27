/**
 * The latest check attempt and how it ended: still `running`, `observed` a
 * result, `aborted` by its owners, `superseded` by a change, or failed with an
 * `error` of its own.
 *
 * @example
 * ```ts
 * const attempt = api.state.get().lastAttempt;
 * ```
 */
export type EndpointAttempt = {
  check: { id: number };
  status: "running" | "observed" | "aborted" | "superseded" | "error";
  /** Epoch milliseconds when the attempt began. */
  startedAt: number;
  /** Epoch milliseconds when the attempt ended, or `null` while it runs. */
  completedAt: number | null;
  /** What ended it, such as `network-change` or `timeout`, or `null`. */
  reason: string | null;
};
