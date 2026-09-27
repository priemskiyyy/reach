import type { ConditionState } from "@priemskiyyy/reach";
import { match } from "ts-pattern";

import { AUTOMATIC_DECISIONS } from "example-shared/darkroom/backup/constants/decisions";
import { formatReasons } from "example-shared/formatting/formatReasons";

/** Where automatic backup stands and why, for the strip above the photos. */
export const formatAutomaticBackup = (
  enabled: boolean,
  { status, reasons }: ConditionState,
) => {
  if (!enabled) {
    return "Off. New photos wait for Back up now, and nothing checks the API on its own.";
  }

  return match(AUTOMATIC_DECISIONS[status])
    .with(
      "back-up",
      () =>
        "On. New photos back up on their own: the API is available and the connection is unmetered.",
    )
    .with(
      "wait",
      () => `Waiting, because nothing can tell yet: ${formatReasons(reasons)}.`,
    )
    .with("pause", () => `Paused: ${formatReasons(reasons)}.`)
    .exhaustive();
};
