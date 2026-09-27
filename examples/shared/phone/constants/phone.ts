import type { SimulatedPhoneNative } from "example-shared/phone/types/SimulatedPhoneNative";

export const PHONE_NATIVE: SimulatedPhoneNative = {
  model: "Darkroom test phone",
};

/** How long the phone stays between two networks of the same name. */
export const REJOIN_DELAY = 1_500;
