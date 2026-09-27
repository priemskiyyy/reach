import type { EvidenceBasis } from "src/types/EvidenceBasis";

/**
 * How one fact in `NetworkState` is backed. Receipt is not measurement:
 * `receivedAt` is when Reach accepted the report, and `verifiedAt` stays
 * `null` unless the source itself says when it verified the fact. Evidence
 * that is not `current` always says why, in `reason`.
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
      /** Epoch milliseconds when Reach accepted the report. */
      receivedAt: number;
      /** Epoch milliseconds when the source verified the fact, only when it says so. */
      verifiedAt: number | null;
      reason: null;
    }
  | {
      status: "unknown" | "unsupported" | "stale" | "error";
      /** The basis of the last current report, or `none` without one. */
      basis: EvidenceBasis;
      /** When the last current report was accepted, or `null` without one. */
      receivedAt: number | null;
      verifiedAt: null;
      /** A short machine-readable code, such as `unobserved` or `source-ambiguous`. */
      reason: string;
    };
