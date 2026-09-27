import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import { mapEvidence } from "src/utils/internal/evidence/mapEvidence";

/** Facts after the source failed: every fact it can observe is an error, which is never offline. */
export const getFailedFacts = (facts: NetworkFacts, reason: string) =>
  mapEvidence(facts, (evidence) => {
    if (evidence.status === "unsupported") {
      return evidence;
    }

    return Object.freeze({
      status: "error",
      basis: evidence.basis,
      receivedAt: evidence.receivedAt,
      verifiedAt: null,
      reason,
    });
  });
