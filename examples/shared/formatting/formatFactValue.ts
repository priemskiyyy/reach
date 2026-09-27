import type { NetworkField, NetworkState, Transport } from "@priemskiyyy/reach";
import { match } from "ts-pattern";

import {
  CONNECTION_STATUS_LABELS,
  CONNECTION_TYPE_LABELS,
  INTERNET_LABELS,
} from "example-shared/darkroom/network/constants/labels";

const formatFlag = (value: boolean | null) => {
  if (value === null) {
    return "Unknown";
  }

  return value ? "Yes" : "No";
};

const formatTransports = (transports: Transport[] | null) => {
  if (transports === null) {
    return "Unknown";
  }

  if (transports.length === 0) {
    return "None";
  }

  return transports
    .map((transport) => CONNECTION_TYPE_LABELS[transport])
    .join(", ");
};

/** One fact's value as the evidence table shows it; a missing value is unknown, never no. */
export const formatFactValue = (
  { connection, internet, cost, preferences }: NetworkState,
  field: NetworkField,
) =>
  match(field)
    .with(
      "connection.status",
      () => CONNECTION_STATUS_LABELS[connection.status],
    )
    .with("connection.type", () => CONNECTION_TYPE_LABELS[connection.type])
    .with("connection.transports", () =>
      formatTransports(connection.transports),
    )
    .with("internet.status", () => INTERNET_LABELS[internet.status])
    .with("cost.metered", () => formatFlag(cost.metered))
    .with("cost.expensive", () => formatFlag(cost.expensive))
    .with("preferences.constrained", () => formatFlag(preferences.constrained))
    .with("preferences.saveData", () => formatFlag(preferences.saveData))
    .exhaustive();
