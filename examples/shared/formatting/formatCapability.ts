import type { FieldCapability } from "@priemskiyyy/reach";

import {
  BASIS_LABELS,
  NOTIFICATION_LABELS,
} from "example-shared/darkroom/network/constants/labels";

/** What the source says it can observe of one fact, before any report arrives. */
export const formatCapability = (capability: FieldCapability | null) => {
  if (capability === null) {
    return "Not declared yet: the source has not opened.";
  }

  if (capability.support === "unsupported") {
    return "This source cannot observe it.";
  }

  const bases = capability.bases.map((basis) => BASIS_LABELS[basis]);

  return `Observed from ${bases.join(" or ")}, ${NOTIFICATION_LABELS[capability.notifications]}.`;
};
