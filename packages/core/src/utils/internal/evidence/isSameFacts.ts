import type { Evidence } from "src/types/Evidence";
import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import type { Transport } from "src/types/Transport";
import { NETWORK_FIELDS } from "src/utils/constants/network";

const isSameTransports = (
  first: Transport[] | null,
  second: Transport[] | null,
) => {
  if (first === null) {
    return second === null;
  }

  if (second === null) {
    return false;
  }

  if (first.length !== second.length) {
    return false;
  }

  return first.every((transport, index) => transport === second[index]);
};

// Receipt time alone is not a change: a repeated report must not churn every subscriber.
const isSameEvidence = (first: Evidence, second: Evidence) => {
  if (first.status !== second.status) {
    return false;
  }

  if (first.basis !== second.basis) {
    return false;
  }

  if (first.verifiedAt !== second.verifiedAt) {
    return false;
  }

  return first.reason === second.reason;
};

const isSameValues = (first: NetworkFacts, second: NetworkFacts) => {
  const pairs: Array<[unknown, unknown]> = [
    [first.connection.status, second.connection.status],
    [first.connection.type, second.connection.type],
    [first.internet.status, second.internet.status],
    [first.cost.metered, second.cost.metered],
    [first.cost.expensive, second.cost.expensive],
    [first.preferences.constrained, second.preferences.constrained],
    [first.preferences.saveData, second.preferences.saveData],
  ];

  return pairs.every(([before, after]) => before === after);
};

/** Whether two facts mean the same, ignoring when they were received. */
export const isSameFacts = (first: NetworkFacts, second: NetworkFacts) => {
  if (!isSameValues(first, second)) {
    return false;
  }

  if (
    !isSameTransports(first.connection.transports, second.connection.transports)
  ) {
    return false;
  }

  return NETWORK_FIELDS.every((field) =>
    isSameEvidence(first.evidence[field], second.evidence[field]),
  );
};
