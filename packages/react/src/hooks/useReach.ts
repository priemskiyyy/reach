import { ReachError } from "@priemskiyyy/reach";
import { useContext } from "react";

import { ReachContext } from "src/context/ReachContext";
import type { ReachNetwork } from "src/types/ReachNetwork";

/**
 * Returns the nearest provider's Reach and throws when the provider is
 * missing. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const status = useNetwork(useReach(), (state) => state.connection.status);
 * ```
 */
export const useReach = (): ReachNetwork => {
  const network = useContext(ReachContext);

  if (network === undefined) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: "Reach hooks must be used within a ReachProvider.",
    });
  }

  return network;
};
