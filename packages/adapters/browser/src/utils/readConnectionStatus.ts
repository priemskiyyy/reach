import type { FieldObservation } from "@priemskiyyy/reach";

import type { BrowserWindowLike } from "src/types/BrowserWindowLike";

/** `navigator.onLine` as a hint: a link to something, never proof of the internet. */
export const readConnectionStatus = ({
  onLine,
}: BrowserWindowLike["navigator"]): FieldObservation<
  "connected" | "disconnected"
> => ({
  status: "current",
  value: onLine ? "connected" : "disconnected",
  basis: "browser-hint",
});
