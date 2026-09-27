import type { ConditionStatus } from "@priemskiyyy/reach";

import type { OnlineEventListenerOptions } from "src/types/OnlineEventListenerOptions";

/** `met` is online and `unmet` offline; `unknown` follows the policy, and `null` publishes nothing. */
export const readOnline = (
  status: ConditionStatus,
  unknown: Required<OnlineEventListenerOptions>["unknown"],
): boolean | null => {
  if (status === "met") {
    return true;
  }

  if (status === "unmet") {
    return false;
  }

  if (unknown === "preserve") {
    return null;
  }

  return unknown === "online";
};
