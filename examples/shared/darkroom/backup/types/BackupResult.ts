export type BackupResult =
  | { state: "running" }
  | { state: "backed-up"; uploaded: number }
  | { state: "failed"; uploaded: number; error: unknown }
  | { state: "refused" }
  | { state: "signed-out" }
  | { state: "nothing-waiting" };
