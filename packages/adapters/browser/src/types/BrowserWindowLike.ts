import type { NetworkInformationLike } from "src/types/NetworkInformationLike";

type PageEvent = "online" | "offline" | "pagehide" | "pageshow";

type DocumentEvent = "freeze" | "resume";

/**
 * The part of a browser window the adapter uses: its navigator, its online,
 * offline and page-restoration events, and its document's freeze events.
 * The global `window` satisfies it.
 *
 * @example
 * ```ts
 * const target: BrowserWindowLike = window;
 * ```
 */
export type BrowserWindowLike = {
  navigator: { onLine: boolean; connection?: NetworkInformationLike };
  document: {
    addEventListener: (type: DocumentEvent, listener: () => void) => void;
    removeEventListener: (type: DocumentEvent, listener: () => void) => void;
  };
  addEventListener: (type: PageEvent, listener: () => void) => void;
  removeEventListener: (type: PageEvent, listener: () => void) => void;
};
