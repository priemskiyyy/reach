import type { Activity, ObservableValue } from "@priemskiyyy/reach";

/**
 * The page's visibility as Reach's activity source: a visible page is in the
 * foreground, a hidden one in the background, and without a document it is
 * unknown.
 */
export const createPageActivity = (): ObservableValue<Activity> => ({
  get: () => {
    if (typeof document === "undefined") {
      return "unknown";
    }

    return document.visibilityState === "visible" ? "foreground" : "background";
  },
  subscribe: (listener) => {
    if (typeof document === "undefined") {
      return () => {};
    }

    document.addEventListener("visibilitychange", listener);

    return () => {
      document.removeEventListener("visibilitychange", listener);
    };
  },
});
