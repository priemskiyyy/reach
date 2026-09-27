import type { AccountId } from "example-shared/darkroom/users/types/AccountId";

export type PhotoBackup =
  | { state: "waiting" }
  | { state: "uploading" }
  | { state: "backed-up"; account: AccountId };
