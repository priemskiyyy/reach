import type { Snippet } from "svelte";
import type { ReachNetwork } from "./ReachNetwork.js";

/**
 * The props of `ReachProvider`: the Reach it publishes, whether it holds a
 * runtime lease while mounted, `false` by default, and the content that reads
 * it.
 *
 * @example
 * ```ts
 * const props: ReachProviderProps = { network: reach, start: true };
 * ```
 */
export type ReachProviderProps = {
  network: ReachNetwork;
  start?: boolean | undefined;
  children?: Snippet | undefined;
};
