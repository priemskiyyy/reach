import type {
  ConditionStatus,
  EndpointState,
  EvidenceStatus,
  ReachDiagnosticEventType,
  RuntimeStatus,
} from "@priemskiyyy/reach";

import type { RequestOutcome } from "example-shared/backend/types/RequestOutcome";
import type { AutomaticDecision } from "example-shared/darkroom/backup/types/AutomaticDecision";
import type { BackupResult } from "example-shared/darkroom/backup/types/BackupResult";
import type { ManualDecision } from "example-shared/darkroom/backup/types/ManualDecision";
import type { RefreshOutcome } from "example-shared/darkroom/network/types/RefreshOutcome";
import type { PhotoBackup } from "example-shared/darkroom/photos/types/PhotoBackup";
import type { Tone } from "example-shared/ui/types/Tone";

export const EVIDENCE_TONES: Record<EvidenceStatus, Tone> = {
  current: "positive",
  unknown: "warning",
  unsupported: "neutral",
  stale: "info",
  error: "danger",
};

export const CONDITION_TONES: Record<ConditionStatus, Tone> = {
  met: "positive",
  unmet: "danger",
  unknown: "warning",
};

export const ENDPOINT_STATUS_TONES: Record<EndpointState["status"], Tone> = {
  available: "positive",
  unavailable: "danger",
  unknown: "warning",
};

export const FRESHNESS_TONES: Record<EndpointState["freshness"], Tone> = {
  never: "neutral",
  fresh: "positive",
  stale: "warning",
};

export const RUNTIME_TONES: Record<RuntimeStatus["state"], Tone> = {
  idle: "neutral",
  starting: "info",
  running: "positive",
  error: "danger",
  disposed: "neutral",
};

export const REFRESH_TONES: Record<RefreshOutcome["status"], Tone> = {
  updated: "positive",
  unchanged: "neutral",
  superseded: "warning",
  unsupported: "neutral",
  failed: "danger",
};

export const REQUEST_TONES: Record<RequestOutcome, Tone> = {
  ready: "positive",
  degraded: "warning",
  stored: "positive",
  unavailable: "danger",
  aborted: "warning",
  "no-signal": "danger",
  portal: "danger",
};

export const PHOTO_BACKUP_TONES: Record<PhotoBackup["state"], Tone> = {
  waiting: "warning",
  uploading: "info",
  "backed-up": "positive",
};

export const AUTOMATIC_DECISION_TONES: Record<AutomaticDecision, Tone> = {
  "back-up": "positive",
  wait: "warning",
  pause: "neutral",
};

export const MANUAL_DECISION_TONES: Record<ManualDecision, Tone> = {
  upload: "positive",
  try: "warning",
  refuse: "danger",
};

export const BACKUP_RESULT_TONES: Record<BackupResult["state"], Tone> = {
  running: "info",
  "backed-up": "positive",
  failed: "danger",
  refused: "warning",
  "signed-out": "neutral",
  "nothing-waiting": "neutral",
};

export const EVENT_TONES: Record<ReachDiagnosticEventType, Tone> = {
  "lease-acquired": "neutral",
  "lease-released": "neutral",
  "session-opening": "info",
  "session-opened": "positive",
  "source-unavailable": "warning",
  "session-failed": "danger",
  "session-stopped": "neutral",
  disposed: "neutral",
  "observation-accepted": "accent",
  "observation-duplicate": "neutral",
  "observation-discarded": "warning",
  "late-callback": "warning",
  "source-invalidated": "warning",
  "source-error": "danger",
  "refresh-started": "info",
  "refresh-settled": "neutral",
  "monitor-acquired": "neutral",
  "monitor-released": "neutral",
  "check-started": "info",
  "check-joined": "accent",
  "check-completed": "positive",
  "check-aborted": "warning",
  "check-superseded": "warning",
  "check-failed": "danger",
  "check-skipped": "neutral",
  "listener-error": "danger",
  "cleanup-error": "danger",
};
