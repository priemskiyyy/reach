import type { EndpointAttempt } from "src/types/EndpointAttempt";
import type { EndpointObservation } from "src/types/EndpointObservation";
import type { ReachErrorInfo } from "src/types/ReachErrorInfo";
import type { Completion } from "src/types/internal/Completion";

export type EndpointRecordState = {
  /** The scope key this record's history belongs to. */
  scopeKey: string | null;
  observation: {
    published: EndpointObservation;
    completion: Completion;
  } | null;
  /** `false` once a change of network, scope or session revoked the observation. */
  current: boolean;
  checking: boolean;
  lastAttempt: EndpointAttempt | null;
  error: ReachErrorInfo | null;
};
