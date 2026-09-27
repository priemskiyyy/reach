import type { EndpointState } from "src/types/EndpointState";

// Observations, attempts and errors are frozen per change, so identity tells them apart.
export const isSameEndpointState = (
  previous: EndpointState,
  next: EndpointState,
) => {
  const pairs: Array<[unknown, unknown]> = [
    [previous.status, next.status],
    [previous.freshness, next.freshness],
    [previous.checking, next.checking],
    [previous.scope, next.scope],
    [previous.lastObservation, next.lastObservation],
    [previous.lastAttempt, next.lastAttempt],
    [previous.error, next.error],
  ];

  return pairs.every(([before, after]) => before === after);
};
