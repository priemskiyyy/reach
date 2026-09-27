import type { EvidenceBasis } from "src/types/EvidenceBasis";
import type { EvidenceStatus } from "src/types/EvidenceStatus";

/**
 * How one fact in `NetworkState` is backed. Receipt is not measurement:
 * `receivedAt` is when Reach accepted the report, and `verifiedAt` stays
 * `null` unless the source itself says when it verified the fact.
 *
 * @example
 * ```ts
 * const { status, basis, receivedAt } = reach.state.get().evidence["internet.status"];
 * ```
 */
export type Evidence = {
  status: EvidenceStatus;
  basis: EvidenceBasis;
  /** Epoch milliseconds when Reach accepted the report, or `null` before one. */
  receivedAt: number | null;
  /** Epoch milliseconds when the source verified the fact, only when it says so. */
  verifiedAt: number | null;
  /** A short machine-readable code, such as `source-ambiguous`, or `null`. */
  reason: string | null;
};
