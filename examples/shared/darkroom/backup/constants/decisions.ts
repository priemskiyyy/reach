import type { ConditionStatus } from "@priemskiyyy/reach";

import type { AutomaticDecision } from "example-shared/darkroom/backup/types/AutomaticDecision";
import type { ManualDecision } from "example-shared/darkroom/backup/types/ManualDecision";

/** Nobody asked for an automatic backup, so an unknown answer waits for a better one. */
export const AUTOMATIC_DECISIONS: Record<ConditionStatus, AutomaticDecision> = {
  met: "back-up",
  unknown: "wait",
  unmet: "pause",
};

/** Somebody pressed Back up now, so an unknown answer is worth a try: the upload itself answers. */
export const MANUAL_DECISIONS: Record<ConditionStatus, ManualDecision> = {
  met: "upload",
  unknown: "try",
  unmet: "refuse",
};
