import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import type { NetworkObservation } from "src/types/NetworkObservation";

/**
 * Whether a report starts a new route: the source says so, its opaque route
 * key changed, or the coarse connection facts did. Cost and preference
 * changes never do.
 */
export const isRouteChange = (
  previous: NetworkFacts,
  next: NetworkFacts,
  route: NetworkObservation["route"],
  previousKey: string | number | null,
) => {
  if (route?.changed === true) {
    return true;
  }

  const key = route?.key;

  if (key !== undefined && previousKey !== null && key !== previousKey) {
    return true;
  }

  if (previous.connection.status !== next.connection.status) {
    return true;
  }

  return previous.connection.type !== next.connection.type;
};
