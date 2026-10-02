import type { EvidenceBasis } from "src/types/EvidenceBasis";

/**
 * How one fact in `NetworkState` is backed: its basis, and `receivedAt`, when
 * Reach accepted the report. Receipt is not verification; a verified fact
 * says so in its basis, such as `native-validation`. Evidence that is not
 * `current` always says why, in `reason`.
 *
 * @example
 * ```ts
 * const evidence = reach.state.get().evidence["internet.status"];
 *
 * if (evidence.status !== "current") {
 *   console.info(evidence.reason);
 * }
 * ```
 */
export type Evidence =
  | {
      status: "current";
      basis: Exclude<EvidenceBasis, "none">;
      /**
       * Epoch milliseconds when Reach accepted the report. A repeated identical
       * report, a `refresh()` that confirms the fact included, does not move
       * it: it bounds the age of the fact, not the time it was last confirmed.
       */
      receivedAt: number;
      reason: null;
    }
  | {
      status: "unknown" | "unsupported" | "stale" | "error";
      /** The basis of the last current report, or `none` without one. */
      basis: EvidenceBasis;
      /** When the last current report was accepted, or `null` without one. */
      receivedAt: number | null;
      /** A short machine-readable code, such as `unobserved` or `source-ambiguous`. */
      reason: string;
    };
