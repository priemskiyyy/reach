import type { FieldCapability } from "@priemskiyyy/reach";

/** A fact no standard browser API reports. */
export const UNSUPPORTED_FIELD: FieldCapability =
  Object.freeze<FieldCapability>({ support: "unsupported" });

/** `navigator.onLine`, a hint the online and offline events keep current. */
export const ONLINE_HINT_FIELD: FieldCapability =
  Object.freeze<FieldCapability>({
    support: "supported",
    notifications: "complete",
    bases: ["browser-hint"],
  });
