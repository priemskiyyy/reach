import type { RequirementFields } from "src/types/internal/RequirementFields";
import type { NetworkField } from "src/types/NetworkField";
import type { NetworkRequirements } from "src/types/NetworkRequirements";
import type { NetworkState } from "src/types/NetworkState";

type RequirementRule = {
  field: NetworkField;
  required: (requirements: NetworkRequirements) => unknown;
  actual: (state: NetworkState) => unknown;
};

/** How each requirement reads its fact, in the order its reasons are listed. */
export const REQUIREMENT_RULES = Object.freeze({
  connection: {
    field: "connection.status",
    required: (requirements) => requirements.connection,
    actual: (state) => state.connection.status,
  },
  internet: {
    field: "internet.status",
    required: (requirements) => requirements.internet,
    actual: (state) => state.internet.status,
  },
  type: {
    field: "connection.type",
    required: (requirements) => requirements.type,
    actual: (state) => state.connection.type,
  },
  metered: {
    field: "cost.metered",
    required: (requirements) => requirements.metered,
    actual: (state) => state.cost.metered,
  },
  expensive: {
    field: "cost.expensive",
    required: (requirements) => requirements.expensive,
    actual: (state) => state.cost.expensive,
  },
  constrained: {
    field: "preferences.constrained",
    required: (requirements) => requirements.constrained,
    actual: (state) => state.preferences.constrained,
  },
  saveData: {
    field: "preferences.saveData",
    required: (requirements) => requirements.saveData,
    actual: (state) => state.preferences.saveData,
  },
} satisfies Record<keyof RequirementFields, RequirementRule>);
