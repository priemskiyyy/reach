import type { ConnectionType, FieldObservation } from "@priemskiyyy/reach";

import type { NetworkInformationLike } from "src/types/NetworkInformationLike";
import { BROWSER_CONNECTION_TYPES } from "src/utils/constants/connectionTypes";

/** The Network Information type; an effective type such as `4g` is never read as a radio. */
export const readConnectionType = (
  connection: NetworkInformationLike | null,
): FieldObservation<Exclude<ConnectionType, "unknown">> => {
  if (connection?.type === undefined) {
    return { status: "unsupported" };
  }

  const type = BROWSER_CONNECTION_TYPES.get(connection.type);

  if (type === undefined) {
    return { status: "unknown" };
  }

  return { status: "current", value: type, basis: "browser-hint" };
};
