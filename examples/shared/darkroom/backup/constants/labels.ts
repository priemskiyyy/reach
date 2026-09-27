import type { AutomaticDecision } from "example-shared/darkroom/backup/types/AutomaticDecision";
import type { BackupRun } from "example-shared/darkroom/backup/types/BackupRun";
import type { ManualDecision } from "example-shared/darkroom/backup/types/ManualDecision";
import type { PhotoBackup } from "example-shared/darkroom/photos/types/PhotoBackup";

export const AUTOMATIC_DECISION_LABELS: Record<AutomaticDecision, string> = {
  "back-up": "Backs up",
  wait: "Waits",
  pause: "Pauses",
};

export const MANUAL_DECISION_LABELS: Record<ManualDecision, string> = {
  upload: "Uploads",
  try: "Tries anyway",
  refuse: "Refuses",
};

export const TRIGGER_LABELS: Record<BackupRun["trigger"], string> = {
  automatic: "Automatic backup",
  manual: "Back up now",
};

export const PHOTO_BACKUP_LABELS: Record<PhotoBackup["state"], string> = {
  waiting: "Waiting",
  uploading: "Uploading",
  "backed-up": "Backed up",
};
