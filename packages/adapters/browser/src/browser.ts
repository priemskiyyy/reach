import type { NetworkAdapter } from "@priemskiyyy/reach";
import { ReachError } from "@priemskiyyy/reach";

import type { BrowserNative } from "src/types/BrowserNative";
import type { BrowserOptions } from "src/types/BrowserOptions";
import type { BrowserWindowLike } from "src/types/BrowserWindowLike";
import { getBrowserCapabilities } from "src/utils/getBrowserCapabilities";
import { readBrowserObservation } from "src/utils/readBrowserObservation";

const resolveWindow = (
  target: BrowserWindowLike | undefined,
): BrowserWindowLike => {
  if (target !== undefined) {
    return target;
  }

  // A server render has no window.
  if (typeof window !== "object") {
    throw new ReachError({
      code: "UNSUPPORTED_ENVIRONMENT",
      message:
        "The browser adapter needs a window. Start Reach in the browser.",
    });
  }

  return window;
};

/**
 * Observes one browser window: `navigator.onLine` as a connection hint, the
 * Network Information type and data-saver preference where the browser has
 * them, and page hiding as an observation gap. It never reports internet
 * access or cost; nothing standard in a browser says either.
 *
 * @example
 * ```ts
 * const reach = new Reach({ adapter: browser() });
 *
 * reach.start();
 * ```
 */
export const browser = ({
  target,
}: BrowserOptions = {}): NetworkAdapter<BrowserNative> => ({
  name: "browser",
  open: (context) => {
    const targetWindow = resolveWindow(target);
    const connection = targetWindow.navigator.connection ?? null;

    const handleChange = () => {
      context.emit(readBrowserObservation(targetWindow));
    };

    // A page on its way into the back/forward cache or a freeze stops being observed.
    const handleGap = () => {
      context.invalidate("observation-gap");
    };

    // Subscribed before the first read, so a change during that read is not lost.
    targetWindow.addEventListener("online", handleChange);
    targetWindow.addEventListener("offline", handleChange);
    targetWindow.addEventListener("pagehide", handleGap);
    targetWindow.addEventListener("pageshow", handleChange);
    context.onDispose(() => {
      targetWindow.removeEventListener("online", handleChange);
      targetWindow.removeEventListener("offline", handleChange);
      targetWindow.removeEventListener("pagehide", handleGap);
      targetWindow.removeEventListener("pageshow", handleChange);
    });

    const targetDocument = targetWindow.document;

    if (targetDocument !== undefined) {
      targetDocument.addEventListener("freeze", handleGap);
      targetDocument.addEventListener("resume", handleChange);
      context.onDispose(() => {
        targetDocument.removeEventListener("freeze", handleGap);
        targetDocument.removeEventListener("resume", handleChange);
      });
    }

    if (
      connection !== null &&
      typeof connection.addEventListener === "function"
    ) {
      connection.addEventListener("change", handleChange);
      context.onDispose(() => {
        connection.removeEventListener?.("change", handleChange);
      });
    }

    handleChange();

    return {
      native: Object.freeze({ connection }),
      capabilities: getBrowserCapabilities(connection),
      refresh: ({ emit }) => {
        emit(readBrowserObservation(targetWindow));
      },
    };
  },
});
