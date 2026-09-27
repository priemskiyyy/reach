import type { EndpointState } from "src/types/EndpointState";
import type { EndpointRecordState } from "src/types/internal/EndpointRecordState";
import type { ProbeVerdict } from "src/types/ProbeVerdict";
import type { ScopeReading } from "src/utils/internal/endpoints/readScope";

const VERDICT_STATUSES = Object.freeze({
  pass: "available",
  fail: "unavailable",
  inconclusive: "unknown",
} satisfies Record<ProbeVerdict, EndpointState["status"]>);

const getFreshness = (
  { observation, current }: EndpointRecordState,
  expired: boolean,
): EndpointState["freshness"] => {
  if (observation === null) {
    return "never";
  }

  if (!current) {
    return "stale";
  }

  return expired ? "stale" : "fresh";
};

const belongsToScope = (
  { scopeKey }: EndpointRecordState,
  reading: ScopeReading,
) => {
  if (reading.scope === "unscoped") {
    return true;
  }

  return scopeKey === reading.key;
};

const getStatus = (
  { observation }: EndpointRecordState,
  freshness: EndpointState["freshness"],
): EndpointState["status"] => {
  if (freshness !== "fresh") {
    return "unknown";
  }

  if (observation === null) {
    return "unknown";
  }

  return VERDICT_STATUSES[observation.published.verdict];
};

/**
 * What an endpoint publishes: a result counts only while fresh, and a record
 * kept for another scope key shows nothing at all, so one account's history
 * never answers for the next.
 */
export const projectEndpointState = (
  record: EndpointRecordState,
  reading: ScopeReading,
  expired: boolean,
): EndpointState => {
  if (!belongsToScope(record, reading)) {
    return Object.freeze({
      status: "unknown",
      freshness: "never",
      checking: false,
      scope: reading.scope,
      lastObservation: null,
      lastAttempt: null,
      error: reading.error,
    });
  }

  const freshness = getFreshness(record, expired);
  const { observation } = record;

  return Object.freeze({
    status: getStatus(record, freshness),
    freshness,
    checking: record.checking,
    scope: reading.scope,
    lastObservation: observation === null ? null : observation.published,
    lastAttempt: record.lastAttempt,
    error: reading.error ?? record.error,
  });
};
