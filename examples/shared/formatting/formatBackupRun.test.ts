import type { ConditionState } from "@priemskiyyy/reach";
import { expect, test } from "vitest";

import type { BackupResult } from "example-shared/darkroom/backup/types/BackupResult";
import type { BackupRun } from "example-shared/darkroom/backup/types/BackupRun";
import { formatAutomaticBackup } from "example-shared/formatting/formatAutomaticBackup";
import { formatBackupRun } from "example-shared/formatting/formatBackupRun";

const MET: ConditionState = { status: "met", reasons: [] };

const UNKNOWN: ConditionState = {
  status: "unknown",
  reasons: [{ code: "unsupported", field: "cost.metered", endpoint: null }],
};

const UNMET: ConditionState = {
  status: "unmet",
  reasons: [{ code: "endpoint-unavailable", field: null, endpoint: "api" }],
};

const run = (
  result: BackupResult,
  condition: ConditionState = MET,
  trigger: BackupRun["trigger"] = "manual",
): BackupRun => ({ id: 1, trigger, account: "ines", condition, result });

test("a run says what it sent and to whom, and a failure says the API is checked again", () => {
  expect(formatBackupRun(run({ state: "backed-up", uploaded: 2 }))).toBe(
    "Backed up 2 photos to Inês Duarte.",
  );
  expect(
    formatBackupRun(
      run({
        state: "failed",
        uploaded: 0,
        error: new Error("The photos API answered 503."),
      }),
    ),
  ).toBe(
    "The upload failed: Error: The photos API answered 503. Darkroom checks the API again.",
  );
  expect(
    formatBackupRun(
      run({ state: "failed", uploaded: 1, error: new TypeError("Failed") }),
    ),
  ).toBe(
    "Backed up 1 photo, then the upload failed: TypeError: Failed. Darkroom checks the API again.",
  );
});

test("Back up now on an unknown API says it tries, and on an unavailable one says why not", () => {
  expect(formatBackupRun(run({ state: "running" }, UNKNOWN))).toBe(
    "Backing up. The API is unknown, so Darkroom tries and lets the upload answer.",
  );
  expect(formatBackupRun(run({ state: "running" }, UNKNOWN, "automatic"))).toBe(
    "Backing up.",
  );
  expect(formatBackupRun(run({ state: "refused" }, UNMET))).toBe(
    "Not now: the API's last check failed.",
  );
  expect(formatBackupRun(run({ state: "signed-out" }))).toBe(
    "Sign in to back up your photos.",
  );
  expect(formatBackupRun(run({ state: "nothing-waiting" }))).toBe(
    "Nothing is waiting to back up.",
  );
});

test("automatic backup backs up when met, waits when unknown and pauses when unmet", () => {
  expect(formatAutomaticBackup(true, MET)).toBe(
    "New photos back up on their own: the API is available and the connection is unmetered.",
  );
  expect(formatAutomaticBackup(true, UNKNOWN)).toBe(
    "Waiting, because nothing can tell yet: this source cannot tell whether the connection is metered.",
  );
  expect(formatAutomaticBackup(true, UNMET)).toBe(
    "Paused: the API's last check failed.",
  );
  expect(formatAutomaticBackup(false, MET)).toBe(
    "New photos wait for Back up now, and nothing checks the API on its own.",
  );
});
