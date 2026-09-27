import type { NetworkFacts } from "src/types/internal/NetworkFacts";

/** Whether a report starts a new network generation: the connection's status or type changed. Cost and preference changes never do. */
export const isConnectionChange = (
  previous: NetworkFacts,
  next: NetworkFacts,
) => {
  if (previous.connection.status !== next.connection.status) {
    return true;
  }

  return previous.connection.type !== next.connection.type;
};
