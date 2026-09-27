import type { FieldObservation } from "@priemskiyyy/reach";

import type { NetInfoStateLike } from "src/types/NetInfoStateLike";
import type { NetInfoProfile } from "src/types/internal/NetInfoProfile";

/**
 * Android reads the system's metering answer. iOS derives its flag from the
 * cellular transport, which is neither metering nor the system's expense, so
 * it is unsupported there.
 */
export const readNetInfoMetered = (
  { details }: NetInfoStateLike,
  { metering }: NetInfoProfile,
): FieldObservation<boolean> => {
  if (!metering) {
    return { status: "unsupported" };
  }

  if (details?.isConnectionExpensive === undefined) {
    return { status: "unknown" };
  }

  return {
    status: "current",
    value: details.isConnectionExpensive,
    basis: "native-metering",
  };
};
