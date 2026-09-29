import type { ParentProps } from "solid-js";

import type { ReachNetwork } from "src/types/ReachNetwork";

/**
 * The Reach to publish, and whether the provider holds a runtime lease while
 * it is mounted, `false` by default.
 *
 * @example
 * ```ts
 * const props: ReachProviderProps = { network: reach, start: true };
 * ```
 */
export type ReachProviderProps = ParentProps<{
  network: ReachNetwork;
  start?: boolean;
}>;
