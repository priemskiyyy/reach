import type { FieldCapability } from "src/types/FieldCapability";

/** A fact the source cannot observe. */
export const UNSUPPORTED_CAPABILITY: FieldCapability = Object.freeze({
  support: "unsupported",
});
