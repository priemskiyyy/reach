import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import type { NetworkObservation } from "src/types/NetworkObservation";
import { freezeList } from "src/utils/internal/common/freezeList";
import { readFieldObservation } from "src/utils/internal/evidence/readFieldObservation";

/** A complete observation as frozen facts; the adapter's objects and arrays are never kept. */
export const readObservation = (
  { connection, internet, cost, preferences }: NetworkObservation,
  receivedAt: number,
): NetworkFacts => {
  const status = readFieldObservation(connection.status, "unknown", receivedAt);
  const type = readFieldObservation(connection.type, "unknown", receivedAt);

  const transports = readFieldObservation(
    connection.transports,
    null,
    receivedAt,
  );

  const internetStatus = readFieldObservation(
    internet.status,
    "unknown",
    receivedAt,
  );

  const metered = readFieldObservation(cost.metered, null, receivedAt);
  const expensive = readFieldObservation(cost.expensive, null, receivedAt);

  const constrained = readFieldObservation(
    preferences.constrained,
    null,
    receivedAt,
  );

  const saveData = readFieldObservation(preferences.saveData, null, receivedAt);

  return Object.freeze({
    connection: Object.freeze({
      status: status.value,
      type: type.value,
      transports:
        transports.value === null ? null : freezeList([...transports.value]),
    }),
    internet: Object.freeze({ status: internetStatus.value }),
    cost: Object.freeze({
      metered: metered.value,
      expensive: expensive.value,
    }),
    preferences: Object.freeze({
      constrained: constrained.value,
      saveData: saveData.value,
    }),
    evidence: Object.freeze({
      "connection.status": status.evidence,
      "connection.type": type.evidence,
      "connection.transports": transports.evidence,
      "internet.status": internetStatus.evidence,
      "cost.metered": metered.evidence,
      "cost.expensive": expensive.evidence,
      "preferences.constrained": constrained.evidence,
      "preferences.saveData": saveData.evidence,
    }),
  });
};
