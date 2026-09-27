import type { EvidenceBasis } from "src/types/EvidenceBasis";

/**
 * What a source can say about one fact: nothing, or how completely it reports
 * the fact's changes and the bases its reports rest on. `complete` is
 * complete for the source's own event contract, not for physical networking.
 *
 * @example
 * ```ts
 * const metering = reach.capabilities.get()?.["cost.metered"];
 * const reliable = metering?.support === "supported" && metering.notifications === "complete";
 * ```
 */
export type FieldCapability =
  | { support: "unsupported" }
  | {
      support: "supported";
      /** `complete` reports every change, `partial` can miss some, and `none` reads the fact only when something else is reported. */
      notifications: "complete" | "partial" | "none";
      bases: Array<Exclude<EvidenceBasis, "none">>;
    };
