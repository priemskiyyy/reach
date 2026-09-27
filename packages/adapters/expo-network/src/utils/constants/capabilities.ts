import type { FieldCapability } from "@priemskiyyy/reach";

/** A fact Expo Network does not report: no transport set, cost or data preference. */
export const UNSUPPORTED_FIELD: FieldCapability =
  Object.freeze<FieldCapability>({ support: "unsupported" });

/** The native path and its transport, reported on every path change. */
export const NATIVE_PATH_FIELD: FieldCapability =
  Object.freeze<FieldCapability>({
    support: "supported",
    notifications: "complete",
    bases: ["native-path"],
  });

/** iOS copies its path into reachability, so only a live no-path event says anything: offline. */
export const NO_PATH_FIELD: FieldCapability = Object.freeze<FieldCapability>({
  support: "supported",
  notifications: "partial",
  bases: ["native-path"],
});

/** Android's validated network, and its no-path state. Expo debounces capability changes and drops one it cannot read. */
export const VALIDATION_FIELD: FieldCapability = Object.freeze<FieldCapability>(
  {
    support: "supported",
    notifications: "partial",
    bases: ["native-validation", "native-path"],
  },
);
