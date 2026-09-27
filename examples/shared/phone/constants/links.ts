import type { LinkReport } from "example-shared/phone/types/LinkReport";
import type { PhoneLink } from "example-shared/phone/types/PhoneLink";

/** What the phone's own network stack says about each connected link. */
export const LINK_REPORTS: Record<Exclude<PhoneLink, "none">, LinkReport> = {
  wifi: { type: "wifi", metered: false, expensive: false, validated: true },
  hotspot: { type: "wifi", metered: true, expensive: true, validated: true },
  portal: { type: "wifi", metered: false, expensive: false, validated: false },
  cellular: {
    type: "cellular",
    metered: true,
    expensive: true,
    validated: true,
  },
};
