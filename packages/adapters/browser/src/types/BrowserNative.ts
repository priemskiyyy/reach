import type { NetworkInformationLike } from "src/types/NetworkInformationLike";

/**
 * The browser's own Network Information object, or `null` without one. Its
 * effective type, round-trip time and downlink estimates are there, never in
 * the normalized state.
 *
 * @example
 * ```ts
 * const connection = reach.native.get()?.connection ?? null;
 * ```
 */
export type BrowserNative = {
  connection: NetworkInformationLike | null;
};
