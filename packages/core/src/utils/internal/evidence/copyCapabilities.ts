import type { FieldCapability } from "src/types/FieldCapability";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import { UNSUPPORTED_CAPABILITY } from "src/utils/constants/capabilities";
import { freezeList } from "src/utils/internal/common/freezeList";

const copyField = (capability: FieldCapability): FieldCapability => {
  if (capability.support === "unsupported") {
    return UNSUPPORTED_CAPABILITY;
  }

  return Object.freeze({
    support: "supported",
    notifications: capability.notifications,
    bases: freezeList([...capability.bases]),
  });
};

/** A frozen copy of what an adapter declared, so the published capabilities never change under a reader. */
export const copyCapabilities = (
  capabilities: NetworkCapabilities,
): NetworkCapabilities =>
  Object.freeze({
    "connection.status": copyField(capabilities["connection.status"]),
    "connection.type": copyField(capabilities["connection.type"]),
    "connection.transports": copyField(capabilities["connection.transports"]),
    "internet.status": copyField(capabilities["internet.status"]),
    "cost.metered": copyField(capabilities["cost.metered"]),
    "cost.expensive": copyField(capabilities["cost.expensive"]),
    "preferences.constrained": copyField(
      capabilities["preferences.constrained"],
    ),
    "preferences.saveData": copyField(capabilities["preferences.saveData"]),
  });
