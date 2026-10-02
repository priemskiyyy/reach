import type { ConditionStatus } from "src/types/ConditionStatus";

/** What a condition on the internet must read when the world said `value`. */
export const readCondition = (
  value: string,
  wanted: "online" | "offline",
): ConditionStatus => {
  if (value === "unknown") {
    return "unknown";
  }

  return value === wanted ? "met" : "unmet";
};
