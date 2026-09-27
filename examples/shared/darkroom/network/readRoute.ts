import type { RequestRoute } from "example-shared/backend/types/RequestRoute";
import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { PhoneState } from "example-shared/phone/types/PhoneState";

/** How far Darkroom's requests get: the simulated phone's link decides, and a browser's network is its own. */
export const readRoute = (
  source: NetworkSource,
  { link }: PhoneState,
): RequestRoute => {
  if (source === "browser") {
    return "direct";
  }

  if (link === "none") {
    return "no-signal";
  }

  if (link === "portal") {
    return "portal";
  }

  return "direct";
};
