import { useEffect } from "react";

import { ReachContext } from "src/context/ReachContext";
import type { ReachProviderProps } from "src/types/ReachProviderProps";

/**
 * Publishes one Reach to the tree below. With `start`, it holds a runtime
 * lease while mounted and releases only that lease on unmount; it never
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
export const ReachProvider = ({
  network,
  start = false,
  children,
}: ReachProviderProps) => {
  useEffect(() => {
    if (!start) {
      return;
    }

    const lease = network.start();

    return lease.release;
  }, [network, start]);

  return (
    <ReachContext.Provider value={network}>{children}</ReachContext.Provider>
  );
};
