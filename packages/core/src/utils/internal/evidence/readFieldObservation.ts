import type { Evidence } from "src/types/Evidence";
import type { FieldObservation } from "src/types/FieldObservation";
import { UNSUPPORTED_EVIDENCE } from "src/utils/constants/network";
import { assertUnreachable } from "src/utils/internal/common/assertUnreachable";

const getMissingEvidence = (
  status: "unknown" | "error",
  reason: string,
): Evidence =>
  Object.freeze({
    status,
    basis: "none",
    receivedAt: null,
    reason,
  });

/** One reported fact as its effective value and evidence; without current evidence the value is `unknownValue`. */
export const readFieldObservation = <TValue, TUnknown extends "unknown" | null>(
  observation: FieldObservation<TValue>,
  unknownValue: TUnknown,
  receivedAt: number,
): { value: TValue | TUnknown; evidence: Evidence } => {
  if (observation.status === "current") {
    return {
      value: observation.value,
      evidence: Object.freeze({
        status: "current",
        basis: observation.basis,
        receivedAt,
        reason: null,
      }),
    };
  }

  if (observation.status === "unsupported") {
    return { value: unknownValue, evidence: UNSUPPORTED_EVIDENCE };
  }

  if (observation.status === "error") {
    return {
      value: unknownValue,
      evidence: getMissingEvidence(
        "error",
        observation.reason ?? "source-error",
      ),
    };
  }

  if (observation.status === "unknown") {
    return {
      value: unknownValue,
      evidence: getMissingEvidence(
        "unknown",
        observation.reason ?? "unobserved",
      ),
    };
  }

  return assertUnreachable(observation);
};
