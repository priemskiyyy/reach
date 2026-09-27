import type { PhoneLink } from "example-shared/phone/types/PhoneLink";

export type PhoneState = {
  link: PhoneLink;
  lowDataMode: boolean;
  /** The phone's connectivity service stopped answering. */
  failing: boolean;
  /** Between two Wi-Fi networks of the same name, reporting nothing. */
  rejoining: boolean;
};
