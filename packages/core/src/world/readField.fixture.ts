import type { NetworkField } from "src/types/NetworkField";
import type { NetworkState } from "src/types/NetworkState";

/** The value each evidence key holds in a state. */
export const READ_FIELD: Record<
  NetworkField,
  (state: NetworkState) => unknown
> = {
  "connection.status": (state) => state.connection.status,
  "connection.type": (state) => state.connection.type,
  "connection.transports": (state) => state.connection.transports,
  "internet.status": (state) => state.internet.status,
  "cost.metered": (state) => state.cost.metered,
  "cost.expensive": (state) => state.cost.expensive,
  "preferences.constrained": (state) => state.preferences.constrained,
  "preferences.saveData": (state) => state.preferences.saveData,
};
