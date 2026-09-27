import type { BrowserWindowLike } from "src/types/BrowserWindowLike";

/**
 * Which window the adapter observes: the global `window` by default,
 * resolved only when the runtime starts, so creating the adapter on a server
 * reads nothing.
 *
 * @example
 * ```ts
 * const options: BrowserOptions = { target: iframe.contentWindow ?? window };
 * ```
 */
export type BrowserOptions = {
  target?: BrowserWindowLike;
};
