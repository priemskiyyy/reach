import type { Transport } from "@priemskiyyy/reach";

import { EXPO_CONNECTION_TYPES } from "src/utils/constants/connectionTypes";

/** The transport an Expo type names; `NONE`, `UNKNOWN` and a missing type name none. */
export const readExpoTransport = (
  type: string | undefined,
): Transport | undefined => {
  if (type === undefined) {
    return undefined;
  }

  return EXPO_CONNECTION_TYPES.get(type);
};
