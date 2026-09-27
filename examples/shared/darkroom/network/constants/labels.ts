import type {
  ConditionStatus,
  ConnectionStatus,
  ConnectionType,
  EndpointAttempt,
  EndpointState,
  EvidenceBasis,
  EvidenceStatus,
  FieldCapability,
  InternetStatus,
  NetworkField,
  ProbeResponse,
  ProbeVerdict,
  ReachDiagnosticEventType,
  RuntimeStatus,
} from "@priemskiyyy/reach";

import type { ConditionId } from "example-shared/darkroom/network/types/ConditionId";
import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { RefreshOutcome } from "example-shared/darkroom/network/types/RefreshOutcome";

/** Every fact, in the order the evidence table lists them. */
export const FIELD_ORDER: NetworkField[] = [
  "connection.status",
  "connection.type",
  "connection.transports",
  "internet.status",
  "cost.metered",
  "cost.expensive",
  "preferences.constrained",
  "preferences.saveData",
];

export const FIELD_LABELS: Record<NetworkField, string> = {
  "connection.status": "Connection",
  "connection.type": "Type",
  "connection.transports": "Transports",
  "internet.status": "Internet",
  "cost.metered": "Metered",
  "cost.expensive": "Expensive",
  "preferences.constrained": "Low Data Mode",
  "preferences.saveData": "Data saver",
};

/** What each fact answers, to finish "cannot tell …". */
export const FIELD_QUESTIONS: Record<NetworkField, string> = {
  "connection.status": "whether it is connected",
  "connection.type": "the connection's type",
  "connection.transports": "the connection's transports",
  "internet.status": "whether the internet is reachable",
  "cost.metered": "whether the connection is metered",
  "cost.expensive": "whether the connection is expensive",
  "preferences.constrained": "whether Low Data Mode is on",
  "preferences.saveData": "whether data saver is on",
};

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  unknown: "Unknown",
};

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  wifi: "Wi-Fi",
  cellular: "Cellular",
  ethernet: "Ethernet",
  bluetooth: "Bluetooth",
  vpn: "VPN",
  wimax: "WiMAX",
  other: "Other",
  none: "None",
  mixed: "Mixed",
  unknown: "Unknown",
};

export const INTERNET_LABELS: Record<InternetStatus, string> = {
  online: "Online",
  offline: "Offline",
  unknown: "Unknown",
};

export const EVIDENCE_LABELS: Record<EvidenceStatus, string> = {
  current: "Current",
  unknown: "Unknown",
  unsupported: "Unsupported",
  stale: "Stale",
  error: "Error",
};

/** What each evidence status claims, and nothing more. */
export const EVIDENCE_MEANINGS: Record<EvidenceStatus, string> = {
  current: "The source reported it, on the basis it names.",
  unknown: "The source could not say. It is never read as false or offline.",
  unsupported: "This source cannot observe it at all.",
  stale:
    "It was reported, but the source may have missed a change since, so nothing relies on it.",
  error: "The source failed, so nothing it said still holds.",
};

/** The evidence statuses in the order the legend explains them. */
export const EVIDENCE_ORDER: EvidenceStatus[] = [
  "current",
  "unknown",
  "unsupported",
  "stale",
  "error",
];

export const BASIS_LABELS: Record<EvidenceBasis, string> = {
  none: "No basis",
  "browser-hint": "Browser hint",
  "provider-report": "Provider report",
  "native-path": "Native path",
  "native-validation": "Native validation",
  "native-metering": "Native metering",
  "native-expense": "Native expense",
  "user-data-preference": "User preference",
  custom: "Custom",
};

export const CONDITION_LABELS: Record<ConditionStatus, string> = {
  met: "Met",
  unmet: "Unmet",
  unknown: "Unknown",
};

/** Each condition Darkroom decides with, and how it is built. */
export const CONDITIONS: Record<ConditionId, { title: string; code: string }> =
  {
    online: {
      title: "Online",
      code: 'reach.condition({ internet: "online" })',
    },
    unmetered: {
      title: "Unmetered",
      code: "reach.condition({ metered: false, constrained: false })",
    },
    api: { title: "API available", code: "api.available" },
    automatic: {
      title: "Automatic backup",
      code: "all(api.available, unmetered)",
    },
  };

export const CONDITION_IDS: ConditionId[] = [
  "online",
  "unmetered",
  "api",
  "automatic",
];

export const ENDPOINT_STATUS_LABELS: Record<EndpointState["status"], string> = {
  available: "Available",
  unavailable: "Unavailable",
  unknown: "Unknown",
};

export const FRESHNESS_LABELS: Record<EndpointState["freshness"], string> = {
  never: "Never checked",
  fresh: "Fresh",
  stale: "Stale",
};

export const VERDICT_LABELS: Record<ProbeVerdict, string> = {
  pass: "Passed",
  fail: "Failed",
  inconclusive: "Inconclusive",
};

export const RESPONSE_LABELS: Record<ProbeResponse, string> = {
  received: "Received",
  "not-observed": "None arrived",
  unknown: "Unknown",
};

export const ATTEMPT_LABELS: Record<EndpointAttempt["status"], string> = {
  running: "Running",
  observed: "Observed",
  aborted: "Aborted",
  superseded: "Superseded",
  error: "Error",
};

export const RUNTIME_LABELS: Record<RuntimeStatus["state"], string> = {
  idle: "Idle",
  starting: "Starting",
  running: "Running",
  error: "Failed to start",
  disposed: "Disposed",
};

export const REFRESH_LABELS: Record<RefreshOutcome["status"], string> = {
  updated: "Updated",
  unchanged: "Unchanged",
  superseded: "Superseded",
  unsupported: "Unsupported",
  failed: "Failed",
};

/** What a check's verdict says, to follow "Check #7". */
export const VERDICT_PHRASES: Record<ProbeVerdict, string> = {
  pass: "passed",
  fail: "failed",
  inconclusive: "was inconclusive",
};

export const SOURCE_LABELS: Record<NetworkSource, string> = {
  phone: "Simulated phone",
  browser: "This browser",
};

/** What each source can tell, in a line. */
export const SOURCE_MEANINGS: Record<NetworkSource, string> = {
  phone:
    "A phone's network stack, inside this page. The lab changes its link, Low Data Mode and service.",
  browser:
    "Your browser's own network, through the real browser adapter. It only hints at the connection, and cannot tell metering at all.",
};

/** How much of a fact's changes the source reports. */
export const NOTIFICATION_LABELS: Record<
  Extract<FieldCapability, { support: "supported" }>["notifications"],
  string
> = {
  complete: "every change reported",
  partial: "some changes may be missed",
  none: "read only alongside other reports",
};

/** The condition statuses in the order a decision table lists them. */
export const CONDITION_STATUS_ORDER: ConditionStatus[] = [
  "met",
  "unknown",
  "unmet",
];

export const EVENT_LABELS: Record<ReachDiagnosticEventType, string> = {
  "lease-acquired": "Lease acquired",
  "lease-released": "Lease released",
  "session-opening": "Session opening",
  "session-opened": "Session opened",
  "source-unavailable": "Source unavailable",
  "session-failed": "Session failed",
  "session-stopped": "Session stopped",
  disposed: "Disposed",
  "observation-accepted": "Observation accepted",
  "observation-duplicate": "Duplicate observation",
  "observation-discarded": "Observation discarded",
  "late-callback": "Late callback",
  "source-invalidated": "Source invalidated",
  "source-error": "Source error",
  "refresh-started": "Refresh started",
  "refresh-settled": "Refresh settled",
  "monitor-acquired": "Monitor acquired",
  "monitor-released": "Monitor released",
  "check-started": "Check started",
  "check-joined": "Check joined",
  "check-completed": "Check completed",
  "check-aborted": "Check aborted",
  "check-superseded": "Check superseded",
  "check-failed": "Check failed",
  "check-skipped": "Check skipped",
  "listener-error": "Listener error",
  "cleanup-error": "Cleanup error",
};
