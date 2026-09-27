import type { EndpointRecordState } from "src/types/internal/EndpointRecordState";
import type { ReachErrorInfo } from "src/types/ReachErrorInfo";

/** A record before its first check, and after a scope change cleared it. */
export const EMPTY_RECORD_STATE: EndpointRecordState = Object.freeze({
  scopeKey: null,
  observation: null,
  current: false,
  checking: false,
  lastAttempt: null,
  error: null,
});

/** Why a scoped endpoint whose scope getter threw cannot check. */
export const SCOPE_ERROR: ReachErrorInfo = Object.freeze({
  code: "SCOPE_UNAVAILABLE",
  message: "The endpoint's scope threw when it was read.",
});
