import type { ConditionState } from "src/types/ConditionState";
import type { EndpointState } from "src/types/EndpointState";
import { MET_CONDITION_STATE } from "src/utils/constants/conditions";
import { createConditionState } from "src/utils/internal/conditions/createConditionState";

const getUnknownReason = ({
  scope,
  freshness,
  lastObservation,
}: EndpointState) => {
  if (scope === "unavailable") {
    return "scope-unavailable";
  }

  if (freshness === "never") {
    return "unobserved";
  }

  if (freshness === "stale") {
    return "stale";
  }

  // A fresh inconclusive check keeps its own explanation.
  return lastObservation?.reason ?? "inconclusive";
};

/** Met while a current check passed; a stale or missing result is unknown, never unavailable. */
export const evaluateAvailability = (
  name: string,
  state: EndpointState,
): ConditionState => {
  const endpoint = { name };

  if (state.status === "available") {
    return MET_CONDITION_STATE;
  }

  if (state.status === "unavailable") {
    return createConditionState("unmet", [
      { code: "endpoint-unavailable", field: null, endpoint },
    ]);
  }

  return createConditionState("unknown", [
    { code: getUnknownReason(state), field: null, endpoint },
  ]);
};
