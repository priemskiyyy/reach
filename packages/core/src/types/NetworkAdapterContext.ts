import type { NetworkObservation } from "src/types/NetworkObservation";
import type { ObservationSlot } from "src/types/ObservationSlot";

/**
 * What an adapter's `open` receives for one session. Everything reported
 * before `open` settles waits until the session is adopted, everything after
 * the session ends is ignored, and `onDispose` is the session's one cleanup:
 * registered after the end, a cleanup runs at once.
 *
 * @example
 * ```ts
 * const open = (context: NetworkAdapterContext) => {
 *   const unsubscribe = sdk.addEventListener((state) => context.emit(toObservation(state)));
 *
 *   context.onDispose(unsubscribe);
 * };
 * ```
 */
export type NetworkAdapterContext = {
  /** Reports a complete observation now. */
  emit: (observation: NetworkObservation) => void;
  /** Reserves a place in the order for a read that finishes later. */
  reserve: () => ObservationSlot;
  /** Makes every current fact stale and starts a new generation, because the source knows it missed changes. */
  invalidate: () => void;
  /** Reports that the source failed; its facts become errors, never offline. */
  reportError: (error: unknown) => void;
  onDispose: (cleanup: () => void) => void;
};
