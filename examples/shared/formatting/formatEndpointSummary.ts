import type { EndpointObservation, EndpointState } from "@priemskiyyy/reach";

import { API_STALE_AFTER } from "example-shared/darkroom/network/constants/endpoint";
import { formatObservation } from "example-shared/formatting/formatObservation";
import { formatSeconds } from "example-shared/formatting/formatSeconds";

type Now = { generation: number; now: number };

const expiresAt = ({ completedAt }: EndpointObservation) =>
  completedAt + API_STALE_AFTER;

// A stale answer was revoked by a network change, outlived its lifetime, or was dropped.
const formatStaleCause = (
  observation: EndpointObservation,
  { generation, now }: Now,
) => {
  if (observation.networkGeneration !== generation) {
    return "the network changed since";
  }

  if (now >= expiresAt(observation)) {
    return `it is older than ${formatSeconds(API_STALE_AFTER)}`;
  }

  return "it was dropped";
};

/**
 * What the API's state means right now: the last answer, and whether it
 * still counts. A signed-out endpoint borrows no one's answer.
 */
export const formatEndpointSummary = (
  { scope, freshness, checking, lastObservation }: EndpointState,
  current: Now,
) => {
  if (scope === "unavailable") {
    return "Nobody is signed in, so the API is not checked, and no other account's answer counts.";
  }

  if (lastObservation === null) {
    return checking
      ? "The first check for this account is on its way."
      : "Not checked yet for this account.";
  }

  const said = formatObservation(lastObservation);

  if (freshness === "fresh") {
    return `${said}. It counts for ${formatSeconds(expiresAt(lastObservation) - current.now)} more.`;
  }

  return `${said}, but it no longer counts: ${formatStaleCause(lastObservation, current)}.`;
};
