import type { EvidenceBasis } from "src/types/EvidenceBasis";
import type { FieldCapability } from "src/types/FieldCapability";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import { freezeList } from "src/utils/internal/common/freezeList";

const OBSERVED_FIELD: FieldCapability = Object.freeze({
  support: "supported",
  notifications: "complete",
  bases: freezeList<EvidenceBasis>(["custom"]),
});

/** A mock source observes every fact, reports every change and knows its routes. */
export const MOCK_CAPABILITIES: NetworkCapabilities = Object.freeze({
  fields: Object.freeze({
    "connection.status": OBSERVED_FIELD,
    "connection.type": OBSERVED_FIELD,
    "connection.transports": OBSERVED_FIELD,
    "internet.status": OBSERVED_FIELD,
    "cost.metered": OBSERVED_FIELD,
    "cost.expensive": OBSERVED_FIELD,
    "preferences.constrained": OBSERVED_FIELD,
    "preferences.saveData": OBSERVED_FIELD,
  }),
  ownership: "owned",
  routeIdentity: "identified",
  upstreamActivity: "none",
});
