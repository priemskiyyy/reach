import { ReachError } from "@priemskiyyy/reach";
import { inject } from "vue";
import type { ComputedRef } from "vue";

import { REACH_CONTEXT } from "src/context/ReachContext";
import type { ReachNetwork } from "src/types/ReachNetwork";

/**
 * Follows the nearest provider's Reach as a computed ref and throws when the
 * provider is missing. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const status = useNetwork(useReach().value, (state) => state.connection.status);
 * ```
 */
export const useReach = (): ComputedRef<ReachNetwork> => {
  const network = inject(REACH_CONTEXT, undefined);

  if (network === undefined) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: "Reach composables must be used within a ReachProvider.",
    });
  }

  return network;
};
