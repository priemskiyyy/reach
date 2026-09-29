import { createComponent, createEffect, createMemo, onCleanup } from "solid-js";

import { ReachContext } from "src/context/ReachContext";
import type { ReachProviderProps } from "src/types/ReachProviderProps";

/**
 * Publishes one Reach to the tree below. With `start`, it holds a runtime
 * lease while mounted and releases only that lease on cleanup; it never
 * disposes the Reach, and it starts no endpoint monitor.
 *
 * @example
 * ```tsx
 * const network = new Reach({ adapter: browser() });
 *
 * <ReachProvider network={network} start>
 *   <Application />
 * </ReachProvider>
 * ```
 */
export const ReachProvider = (props: ReachProviderProps) => {
  // Effects never run on the server, so only a mounted provider holds a lease.
  createEffect(() => {
    if (!props.start) {
      return;
    }

    const lease = props.network.start();

    onCleanup(lease.release);
  });

  return createComponent(ReachContext.Provider, {
    value: createMemo(() => props.network),
    get children() {
      return props.children;
    },
  });
};
