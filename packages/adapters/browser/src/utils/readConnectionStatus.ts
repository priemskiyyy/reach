import type { FieldObservation } from "@priemskiyyy/reach";

import type { BrowserWindowLike } from "src/types/BrowserWindowLike";

/** `navigator.onLine` as a hint; anything but a Boolean is no evidence either way. */
export const readConnectionStatus = (
  navigator: BrowserWindowLike["navigator"],
): FieldObservation<"connected" | "disconnected"> => {
  let onLine: unknown;

  try {
    onLine = navigator.onLine;
  } catch {
    return { status: "error" };
  }

  if (typeof onLine !== "boolean") {
    return { status: "unknown" };
  }

  return {
    status: "current",
    value: onLine ? "connected" : "disconnected",
    basis: "browser-hint",
  };
};
