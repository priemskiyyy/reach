import type { PhoneLink } from "example-shared/phone/types/PhoneLink";
import type { Option } from "example-shared/types/Option";

export const LINK_OPTIONS: Option<PhoneLink>[] = [
  { value: "wifi", label: "Home Wi-Fi" },
  { value: "hotspot", label: "Hotspot" },
  { value: "portal", label: "Hotel Wi-Fi" },
  { value: "cellular", label: "Cellular" },
  { value: "none", label: "No signal" },
];
