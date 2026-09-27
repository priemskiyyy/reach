/**
 * Whether a fact is backed right now. Only `current` evidence carries a value;
 * `unsupported` means the source cannot observe the fact at all, `stale` that
 * observation stopped or was interrupted, and `error` that the source failed.
 *
 * @example
 * ```ts
 * const known = reach.state.get().evidence["cost.metered"].status === "current";
 * ```
 */
export type EvidenceStatus =
  "current" | "unknown" | "unsupported" | "stale" | "error";
