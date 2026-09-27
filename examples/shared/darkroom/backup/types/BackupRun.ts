import type { ConditionState } from "@priemskiyyy/reach";

import type { BackupResult } from "example-shared/darkroom/backup/types/BackupResult";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";

export type BackupRun = {
  id: number;
  trigger: "automatic" | "manual";
  account: AccountId | null;
  /** The condition the run was decided on, as it stood then. */
  condition: ConditionState;
  result: BackupResult;
};
