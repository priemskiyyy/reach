import type { NetworkAdapter } from "@priemskiyyy/reach";

import type { BrowserNative } from "src/types/BrowserNative";
import type { BrowserOptions } from "src/types/BrowserOptions";
import type { BrowserWindowLike } from "src/types/BrowserWindowLike";
import { getBrowserCapabilities } from "src/utils/getBrowserCapabilities";
import { readBrowserObservation } from "src/utils/readBrowserObservation";

/**
 * Observes one browser window: `navigator.onLine` as a connection hint, the
 * Network Information type and data-saver preference where the browser has
 * them, and page hiding as an observation gap. It never reports internet
 * access or cost; nothing standard in a browser says either. Without a
 * window, such as in a server render, it is unavailable.
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
  available: () => {
    if (target !== undefined) {
      return true;
    }

    // A server render has no window.
    return typeof window !== "undefined";
  },
  open: (context) => {
    const page: BrowserWindowLike = target ?? window;
    const connection = page.navigator.connection ?? null;

    const handleChange = () => {
      context.emit(readBrowserObservation(page));
    };

    // A page on its way into the back/forward cache or a freeze stops being observed.
    const handleGap = () => {
      context.invalidate();
    };

    // Subscribed before the first read, so a change during that read is not lost.
    page.addEventListener("online", handleChange);
    page.addEventListener("offline", handleChange);
    page.addEventListener("pagehide", handleGap);
    page.addEventListener("pageshow", handleChange);
    page.document.addEventListener("freeze", handleGap);
    page.document.addEventListener("resume", handleChange);
    connection?.addEventListener("change", handleChange);

    context.onDispose(() => {
      page.removeEventListener("online", handleChange);
      page.removeEventListener("offline", handleChange);
      page.removeEventListener("pagehide", handleGap);
      page.removeEventListener("pageshow", handleChange);
      page.document.removeEventListener("freeze", handleGap);
      page.document.removeEventListener("resume", handleChange);
      connection?.removeEventListener("change", handleChange);
    });

    handleChange();

    return {
      native: Object.freeze({ connection }),
      capabilities: getBrowserCapabilities(connection),
      refresh: ({ emit }) => {
        emit(readBrowserObservation(page));
      },
    };
  },
});
