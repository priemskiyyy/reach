import type { FieldObservation } from "@priemskiyyy/reach";

import type { ExpoPath } from "src/types/internal/ExpoPath";

/** The path itself: connected, disconnected for a trusted no path, or unknown. */
export const readExpoStatus = (
  path: ExpoPath,
): FieldObservation<"connected" | "disconnected"> => {
  if (path.kind === "connected") {
    return { status: "current", value: "connected", basis: "native-path" };
  }

  if (path.kind === "no-path") {
    return { status: "current", value: "disconnected", basis: "native-path" };
  }

  if (path.kind === "ambiguous") {
    return { status: "unknown", reason: "source-ambiguous" };
  }

  return { status: "unknown" };
};
