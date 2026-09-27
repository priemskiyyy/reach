import type { PropsWithChildren } from "react";

import type { ReachNetwork } from "src/types/ReachNetwork";

/**
 * The Reach to publish, and whether the provider holds a runtime lease while
 * it is mounted, `false` by default.
 *
 * @example
 * ```tsx
 * const props: ReachProviderProps = { network: reach, start: true };
 * ```
 */
export type ReachProviderProps = PropsWithChildren<{
  network: ReachNetwork;
  start?: boolean;
}>;
