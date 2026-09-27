import type { ConnectionType, FieldObservation } from "@priemskiyyy/reach";

import type { NetworkInformationLike } from "src/types/NetworkInformationLike";
import { BROWSER_CONNECTION_TYPES } from "src/utils/constants/connectionTypes";

/** The Network Information type; an effective type such as `4g` is never read as a radio. */
export const readConnectionType = (
  connection: NetworkInformationLike | null,
): FieldObservation<Exclude<ConnectionType, "unknown">> => {
  if (connection === null) {
    return { status: "unsupported" };
  }

  let type: unknown;

  try {
    type = connection.type;
  } catch {
    return { status: "error" };
  }

  if (typeof type !== "string") {
    return { status: "unknown" };
  }

  const value = BROWSER_CONNECTION_TYPES.get(type);

  if (value === undefined) {
    return { status: "unknown" };
  }

  return { status: "current", value, basis: "browser-hint" };
};
