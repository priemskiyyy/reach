import type {
  ConditionReason,
  ConditionState,
  EndpointState,
} from "@priemskiyyy/reach";

const UNOBSERVED_REASON: ConditionReason = Object.freeze<ConditionReason>({
  code: "unobserved",
  field: null,
  endpoint: null,
});

const UNOBSERVED_REASONS: ConditionReason[] = [UNOBSERVED_REASON];

Object.freeze(UNOBSERVED_REASONS);

/** A condition on the server and in the hydrating render: nothing observed yet. */
export const SERVER_CONDITION_STATE: ConditionState =
  Object.freeze<ConditionState>({
    status: "unknown",
    reasons: UNOBSERVED_REASONS,
  });

// A server cannot know the client's scope, so it renders an endpoint as unscoped and never checked.
export const SERVER_ENDPOINT_STATE: EndpointState =
  Object.freeze<EndpointState>({
    status: "unknown",
    freshness: "never",
    checking: false,
    scope: "unscoped",
    lastObservation: null,
    lastAttempt: null,
    error: null,
  });
