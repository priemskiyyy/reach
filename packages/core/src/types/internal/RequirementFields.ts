import type { ConnectionType } from "src/types/ConnectionType";

export type RequirementFields = {
  connection: "connected" | "disconnected";
  internet: "online" | "offline";
  type: Exclude<ConnectionType, "unknown">;
  metered: boolean;
  expensive: boolean;
  constrained: boolean;
  saveData: boolean;
};
