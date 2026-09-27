import type { FieldObservation } from "@priemskiyyy/reach";

import type { NetworkInformationLike } from "src/types/NetworkInformationLike";

/** The user's data-saver preference; it is never read as metering or expense. */
export const readSaveData = (
  connection: NetworkInformationLike | null,
): FieldObservation<boolean> => {
  if (connection === null) {
    return { status: "unsupported" };
  }

  let saveData: unknown;

  try {
    saveData = connection.saveData;
  } catch {
    return { status: "error" };
  }

  if (typeof saveData !== "boolean") {
    return { status: "unsupported" };
  }

  return { status: "current", value: saveData, basis: "user-data-preference" };
};
