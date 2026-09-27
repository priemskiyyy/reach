import type { EvidenceBasis } from "src/types/EvidenceBasis";

/**
 * What a source reports for one fact: a `current` value with the basis it
 * rests on, or no value because it is `unknown`, `unsupported` or in `error`.
 * A value exists only on `current`, so a missing fact can never be read as
 * `false`.
 *
 * @example
 * ```ts
 * const metered: FieldObservation<boolean> = {
 *   status: "current",
 *   value: true,
 *   basis: "native-metering",
 * };
 * const expensive: FieldObservation<boolean> = { status: "unsupported" };
 * ```
 */
export type FieldObservation<TValue> =
  | {
      status: "current";
      value: TValue;
      basis: Exclude<EvidenceBasis, "none">;
    }
  | { status: "unknown"; reason?: string }
  | { status: "unsupported" }
  | { status: "error"; reason?: string };
