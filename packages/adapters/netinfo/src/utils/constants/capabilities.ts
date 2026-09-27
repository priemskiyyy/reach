import type { FieldCapability } from "@priemskiyyy/reach";

/** A fact NetInfo does not report with Reach's meaning. */
export const UNSUPPORTED_FIELD: FieldCapability =
  Object.freeze<FieldCapability>({
    support: "unsupported",
    notifications: "none",
    bases: [],
  });

/** The native connection type and state, reported on every change NetInfo sees. */
export const NATIVE_PATH_FIELD: FieldCapability =
  Object.freeze<FieldCapability>({
    support: "supported",
    notifications: "complete",
    bases: ["native-path"],
  });

/** NetInfo's reachability, which arrives after its own checks, and its explicit no-path state. */
export const REACHABILITY_FIELD: FieldCapability =
  Object.freeze<FieldCapability>({
    support: "supported",
    notifications: "partial",
    bases: ["provider-report", "native-path"],
  });

/** Android's metering answer; NetInfo's change filter skips a metering-only change. */
export const METERING_FIELD: FieldCapability = Object.freeze<FieldCapability>({
  support: "supported",
  notifications: "partial",
  bases: ["native-metering"],
});
