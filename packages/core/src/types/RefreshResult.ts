import type { NetworkState } from "src/types/NetworkState";

/**
 * How a source refresh went: its report `updated` or left `unchanged` the
 * state, a newer event `superseded` it, or the source cannot refresh at all.
 * It never checks an endpoint, and `state` is the snapshot when it settled.
 *
 * @example
 * ```ts
 * const { status, state } = await reach.refresh();
 * ```
 */
export type RefreshResult = {
  status: "updated" | "unchanged" | "superseded" | "unsupported";
  state: NetworkState;
};
