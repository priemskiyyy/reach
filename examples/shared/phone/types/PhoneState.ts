import type { PhoneLink } from "example-shared/phone/types/PhoneLink";

export type PhoneState = {
  link: PhoneLink;
  lowDataMode: boolean;
  /** The phone's connectivity service stopped answering. */
  failing: boolean;
  /** Joining another network of the same type, which the facts alone cannot show, and reporting nothing meanwhile. */
  joining: boolean;
};
