import type { RequirementFields } from "src/types/internal/RequirementFields";

/**
 * Exact values the current facts must have, at least one of them, all of
 * them together. `unknown` is never a requirement: it is what a condition
 * answers when the evidence is missing.
 *
 * @example
 * ```ts
 * const bulk: NetworkRequirements = { internet: "online", metered: false };
 * ```
 */
export type NetworkRequirements = {
  [TKey in keyof RequirementFields]: Pick<RequirementFields, TKey> &
    Partial<Omit<RequirementFields, TKey>>;
}[keyof RequirementFields];
