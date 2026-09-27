import type { Evidence, NetworkField } from "@priemskiyyy/reach";

import { BASIS_LABELS } from "example-shared/darkroom/network/constants/labels";
import { formatClockTime } from "example-shared/formatting/formatClockTime";
import { formatReason } from "example-shared/formatting/formatReason";

/** A current fact names its basis and when it arrived; any other says why, in the conditions' words. */
export const formatEvidence = (evidence: Evidence, field: NetworkField) => {
  if (evidence.status === "current") {
    return `${BASIS_LABELS[evidence.basis]}, at ${formatClockTime(evidence.receivedAt)}`;
  }

  return formatReason({ code: evidence.reason, field, endpoint: null });
};
