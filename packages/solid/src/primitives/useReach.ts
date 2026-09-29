import { ReachError } from "@priemskiyyy/reach";
import { useContext } from "solid-js";
import type { Accessor } from "solid-js";

import { ReachContext } from "src/context/ReachContext";
import type { ReachNetwork } from "src/types/ReachNetwork";

/**
 * Follows the nearest provider's Reach as an accessor and throws when the
 * provider is missing. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const status = useNetwork(useReach()(), (state) => state.connection.status);
 * ```
 */
export const useReach = (): Accessor<ReachNetwork> => {
  const network = useContext(ReachContext);

  if (network === undefined) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: "Reach primitives must be used within a ReachProvider.",
    });
  }

  return network;
};
