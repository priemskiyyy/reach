import type { FieldObservation } from "src/types/FieldObservation";
import type { NetworkField } from "src/types/NetworkField";
import { observeTruth } from "src/world/observeTruth.fixture";
import type { Truth } from "src/world/types/Truth";

/** The facts the fake world reports on, as the world's own sensor mapping gives them. */
export const WORLD_FIELDS: Array<{
  field: NetworkField;
  read: (truth: Truth) => FieldObservation<unknown>;
}> = [
  {
    field: "connection.status",
    read: (truth) => observeTruth(truth).connection.status,
  },
  {
    field: "connection.type",
    read: (truth) => observeTruth(truth).connection.type,
  },
  {
    field: "internet.status",
    read: (truth) => observeTruth(truth).internet.status,
  },
  { field: "cost.metered", read: (truth) => observeTruth(truth).cost.metered },
];
