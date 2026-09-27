import type { EvidenceBasis } from "src/types/EvidenceBasis";

/**
 * What a source can say about one fact: whether it observes it at all,
 * whether it reports every change of it, and on which bases. `complete` is
 * complete for the source's own event contract, not for physical networking.
 *
 * @example
 * ```ts
 * const metering = reach.capabilities.get()?.fields["cost.metered"];
 * const reliable = metering?.support === "supported" && metering.notifications === "complete";
 * ```
 */
export type FieldCapability = {
  support: "supported" | "unsupported" | "unknown";
  notifications: "complete" | "partial" | "none" | "unknown";
  bases: EvidenceBasis[];
};
