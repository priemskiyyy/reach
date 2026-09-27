import type { EvidenceBasis } from "src/types/EvidenceBasis";
import type { FieldCapability } from "src/types/FieldCapability";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import { freezeList } from "src/utils/internal/common/freezeList";

const OBSERVED_FIELD: FieldCapability = Object.freeze({
  support: "supported",
  notifications: "complete",
  // A test may report any fact on any basis, so every one is declared.
  bases: freezeList<Exclude<EvidenceBasis, "none">>([
    "browser-hint",
    "provider-report",
    "native-path",
    "native-validation",
    "native-metering",
    "native-expense",
    "user-data-preference",
    "custom",
  ]),
});

/** A mock source observes every fact on every basis and reports every change. */
export const MOCK_CAPABILITIES: NetworkCapabilities = Object.freeze({
  "connection.status": OBSERVED_FIELD,
  "connection.type": OBSERVED_FIELD,
  "connection.transports": OBSERVED_FIELD,
  "internet.status": OBSERVED_FIELD,
  "cost.metered": OBSERVED_FIELD,
  "cost.expensive": OBSERVED_FIELD,
  "preferences.constrained": OBSERVED_FIELD,
  "preferences.saveData": OBSERVED_FIELD,
});
