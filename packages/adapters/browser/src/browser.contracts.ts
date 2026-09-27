// Typechecked, never run: the real DOM window satisfies the structural type
// the adapter uses, so Reach never needs the DOM at runtime.
import { browser } from "src/browser";
import type { BrowserWindowLike } from "src/types/BrowserWindowLike";

export const target: BrowserWindowLike = window;

export const adapter = browser({ target: window });

// @ts-expect-error An object without events is not a window.
export const notWindow = browser({ target: { navigator: { onLine: true } } });
