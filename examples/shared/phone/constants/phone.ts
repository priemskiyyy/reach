import type { SimulatedPhoneNative } from "example-shared/phone/types/SimulatedPhoneNative";

export const PHONE_NATIVE: SimulatedPhoneNative = {
  model: "Darkroom test phone",
};

/** How long the phone takes to join another network of the same type. */
export const JOIN_DELAY = 1_500;
