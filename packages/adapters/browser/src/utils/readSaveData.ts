import type { FieldObservation } from "@priemskiyyy/reach";

import type { NetworkInformationLike } from "src/types/NetworkInformationLike";

/** The user's data-saver preference; it is never read as metering or expense. */
export const readSaveData = (
  connection: NetworkInformationLike | null,
): FieldObservation<boolean> => {
  if (connection?.saveData === undefined) {
    return { status: "unsupported" };
  }

  return {
    status: "current",
    value: connection.saveData,
    basis: "user-data-preference",
  };
};
