import type { NetworkObservation } from "src/types/NetworkObservation";

/**
 * A place in the source's order, reserved before a read that finishes later.
 * What it reports is dropped when anything reported after the reservation
 * arrived first, so a slow initial read can never overwrite a newer event,
 * and a failure of such a read is never a current source error.
 *
 * @example
 * ```ts
 * const slot = context.reserve();
 *
 * sdk.fetch().then((state) => slot.emit(toObservation(state)), slot.reportError);
 * ```
 */
export type ObservationSlot = {
  emit: (observation: NetworkObservation) => void;
  reportError: (error: unknown) => void;
};
