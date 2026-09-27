import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import { mapEvidence } from "src/utils/internal/evidence/mapEvidence";

/** Facts after observation stopped or was interrupted: current evidence turns stale, keeping its basis as history. */
export const getStaleFacts = (facts: NetworkFacts, reason: string) =>
  mapEvidence(facts, (evidence) => {
    if (evidence.status !== "current") {
      return evidence;
    }

    return Object.freeze({
      status: "stale",
      basis: evidence.basis,
      receivedAt: evidence.receivedAt,
      verifiedAt: null,
      reason,
    });
  });
