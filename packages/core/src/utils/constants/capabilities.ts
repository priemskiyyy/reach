import type { FieldCapability } from "src/types/FieldCapability";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";

/** A fact the source cannot observe. */
export const UNSUPPORTED_CAPABILITY: FieldCapability = Object.freeze({
  support: "unsupported",
});

/** What a host without the source can observe: nothing. */
export const UNAVAILABLE_CAPABILITIES: NetworkCapabilities = Object.freeze({
  "connection.status": UNSUPPORTED_CAPABILITY,
  "connection.type": UNSUPPORTED_CAPABILITY,
  "connection.transports": UNSUPPORTED_CAPABILITY,
  "internet.status": UNSUPPORTED_CAPABILITY,
  "cost.metered": UNSUPPORTED_CAPABILITY,
  "cost.expensive": UNSUPPORTED_CAPABILITY,
  "preferences.constrained": UNSUPPORTED_CAPABILITY,
  "preferences.saveData": UNSUPPORTED_CAPABILITY,
});
