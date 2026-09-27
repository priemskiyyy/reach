import { match } from "ts-pattern";

import type { BackupRun } from "example-shared/darkroom/backup/types/BackupRun";
import { formatAccount } from "example-shared/formatting/formatAccount";
import { formatError } from "example-shared/formatting/formatError";
import { formatPhotoCount } from "example-shared/formatting/formatPhotoCount";
import { formatReasons } from "example-shared/formatting/formatReasons";

// An error's message may end its own sentence already.
const endSentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

/** What a backup run did, in a sentence; a run on an unknown API says it tried. */
export const formatBackupRun = ({
  trigger,
  account,
  condition,
  result,
}: BackupRun) =>
  match(result)
    .with({ state: "running" }, () =>
      trigger === "manual" && condition.status === "unknown"
        ? "Backing up. The API is unknown, so Darkroom tries and lets the upload answer."
        : "Backing up.",
    )
    .with(
      { state: "backed-up" },
      ({ uploaded }) =>
        `Backed up ${formatPhotoCount(uploaded)} to ${formatAccount(account)}.`,
    )
    .with(
      { state: "failed", uploaded: 0 },
      ({ error }) =>
        `The upload failed: ${endSentence(formatError(error))} Darkroom checks the API again.`,
    )
    .with(
      { state: "failed" },
      ({ uploaded, error }) =>
        `Backed up ${formatPhotoCount(uploaded)}, then the upload failed: ${endSentence(formatError(error))} Darkroom checks the API again.`,
    )
    .with(
      { state: "refused" },
      () => `Not now: ${formatReasons(condition.reasons)}.`,
    )
    .with({ state: "signed-out" }, () => "Sign in to back up your photos.")
    .with({ state: "nothing-waiting" }, () => "Nothing is waiting to back up.")
    .exhaustive();
