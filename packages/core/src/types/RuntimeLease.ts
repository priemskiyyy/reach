/**
 * One owner's hold on the runtime. `ready` resolves once the source is
 * adopted, which says nothing about connectivity, and rejects when opening
 * fails or this lease is released first; `release` is idempotent and ends
 * only this hold.
 *
 * @example
 * ```ts
 * const lease = reach.start();
 *
 * await lease.ready;
 * lease.release();
 * ```
 */
export type RuntimeLease = {
  ready: Promise<void>;
  release: () => void;
};
