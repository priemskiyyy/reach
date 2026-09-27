import type { ConditionReason } from "@priemskiyyy/reach";

import { formatReason } from "example-shared/formatting/formatReason";

/** Every reason once, in the order the condition gave them. */
export const formatReasons = (reasons: ConditionReason[]) =>
  [...new Set(reasons.map(formatReason))].join("; ");
