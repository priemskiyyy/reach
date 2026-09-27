import type { FieldObservation, Transport } from "@priemskiyyy/reach";

import type { ExpoPath } from "src/types/internal/ExpoPath";

/** A transport while connected, `none` for a trusted no path; an ambiguous `NONE` is no type at all. */
export const readExpoType = (
  path: ExpoPath,
): FieldObservation<Transport | "none"> => {
  if (path.kind === "no-path") {
    return { status: "current", value: "none", basis: "native-path" };
  }

  if (path.kind === "ambiguous") {
    return { status: "unknown", reason: "source-ambiguous" };
  }

  if (path.kind === "unreported") {
    return { status: "unknown" };
  }

  if (path.transport === undefined) {
    return { status: "unknown" };
  }

  return { status: "current", value: path.transport, basis: "native-path" };
};
