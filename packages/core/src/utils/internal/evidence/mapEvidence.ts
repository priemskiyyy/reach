import type { Evidence } from "src/types/Evidence";
import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import { UNKNOWN_NETWORK_STATE } from "src/utils/constants/network";

/** Facts whose evidence `map` replaced; it answers no current evidence, so every value becomes unknown. */
export const mapEvidence = (
  { evidence }: NetworkFacts,
  map: (evidence: Evidence) => Exclude<Evidence, { status: "current" }>,
): NetworkFacts =>
  Object.freeze({
    connection: UNKNOWN_NETWORK_STATE.connection,
    internet: UNKNOWN_NETWORK_STATE.internet,
    cost: UNKNOWN_NETWORK_STATE.cost,
    preferences: UNKNOWN_NETWORK_STATE.preferences,
    evidence: Object.freeze({
      "connection.status": map(evidence["connection.status"]),
      "connection.type": map(evidence["connection.type"]),
      "connection.transports": map(evidence["connection.transports"]),
      "internet.status": map(evidence["internet.status"]),
      "cost.metered": map(evidence["cost.metered"]),
      "cost.expensive": map(evidence["cost.expensive"]),
      "preferences.constrained": map(evidence["preferences.constrained"]),
      "preferences.saveData": map(evidence["preferences.saveData"]),
    }),
  });
