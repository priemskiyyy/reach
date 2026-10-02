import { observeTruth } from "src/world/observeTruth.fixture";
import type { Expected } from "src/world/types/Expected";

/** The connection a report holds, as one comparable word. */
export const connectionOf = (expected: Expected) => {
  if (expected.kind !== "truth") {
    return "unknown/unknown";
  }

  const { connection } = observeTruth(expected.truth);

  const status =
    connection.status.status === "current"
      ? connection.status.value
      : "unknown";

  const type =
    connection.type.status === "current" ? connection.type.value : "unknown";

  return `${status}/${type}`;
};
