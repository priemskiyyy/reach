import { ReachError } from "@priemskiyyy/reach";
import { getContext } from "svelte";
import { REACH_CONTEXT } from "../context/ReachContext.js";
import type { ReachNetwork } from "../types/ReachNetwork.js";
import type { ReadableValue } from "../types/ReadableValue.js";

/**
 * Follows the nearest provider's Reach through `current` and throws when the
 * provider is missing. Reading it starts nothing.
 *
 * @example
 * ```ts
 * const status = useNetwork(useReach().current, (state) => state.connection.status);
 * ```
 */
export const useReach = (): ReadableValue<ReachNetwork> => {
  const network = getContext<ReadableValue<ReachNetwork> | undefined>(
    REACH_CONTEXT,
  );

  if (network === undefined) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: "Reach utilities must be used within a ReachProvider.",
    });
  }

  return network;
};
