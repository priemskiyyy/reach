import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";
import type { ExpoPath } from "src/types/internal/ExpoPath";
import { readExpoTransport } from "src/utils/readExpoTransport";

/**
 * A connected state is a satisfied path on both platforms, whatever its type.
 * A negative one is no path only for `NONE` from a source trusted with it.
 */
export const readExpoPath = (
  { type, isConnected }: ExpoNetworkStateLike,
  noPathTrusted: boolean,
): ExpoPath => {
  if (isConnected === undefined) {
    return { kind: "unreported" };
  }

  if (isConnected) {
    return { kind: "connected", transport: readExpoTransport(type) };
  }

  // Android answers UNKNOWN with every flag false after an exception it swallows.
  if (type !== "NONE") {
    return { kind: "ambiguous" };
  }

  if (!noPathTrusted) {
    return { kind: "ambiguous" };
  }

  return { kind: "no-path" };
};
