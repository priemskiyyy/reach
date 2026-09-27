import type { ReachErrorInfo } from "src/types/ReachErrorInfo";

/** A scope source read once: no source, a current key, or no key, with the error when reading it threw. */
export type ScopeReading =
  | { scope: "unscoped"; key: null; error: null }
  | { scope: "available"; key: string; error: null }
  | { scope: "unavailable"; key: null; error: ReachErrorInfo | null };
