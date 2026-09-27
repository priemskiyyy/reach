import type { ReachErrorInfo } from "src/types/ReachErrorInfo";

/**
 * Where the runtime stands, apart from any network fact: `idle` without a
 * lease, `starting` while the adapter opens, `running` once it is adopted,
 * `error` when opening failed, and `disposed` for good. `running` says the
 * source is observed, never that anything is reachable.
 *
 * @example
 * ```ts
 * const status = reach.status.get();
 *
 * if (status.state === "error") {
 *   console.warn(status.error.code);
 * }
 * ```
 */
export type RuntimeStatus =
  | { state: "idle" }
  | { state: "starting" }
  | { state: "running"; refreshing: boolean }
  | { state: "error"; error: ReachErrorInfo }
  | { state: "disposed" };
