/**
 * What a fact rests on: a browser hint, a provider's own report, a native
 * path, validation, metering or expense reading, a user's data preference, or
 * a custom source. The bases are different kinds of evidence, not ranks on
 * one confidence scale; `none` is the basis of a fact nobody reported.
 *
 * @example
 * ```ts
 * const basis: EvidenceBasis = reach.state.get().evidence["connection.status"].basis;
 * ```
 */
export type EvidenceBasis =
  | "none"
  | "browser-hint"
  | "provider-report"
  | "native-path"
  | "native-validation"
  | "native-metering"
  | "native-expense"
  | "user-data-preference"
  | "custom";
