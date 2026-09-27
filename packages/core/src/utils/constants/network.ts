import type { Evidence } from "src/types/Evidence";
import type { NetworkField } from "src/types/NetworkField";
import type { NetworkState } from "src/types/NetworkState";
import { freezeList } from "src/utils/internal/common/freezeList";

/** Evidence for a fact no source has reported yet. */
const UNOBSERVED_EVIDENCE: Evidence = Object.freeze({
  status: "unknown",
  basis: "none",
  receivedAt: null,
  reason: "unobserved",
});

/** Evidence for every fact on a host without the source, such as a server render. */
export const UNAVAILABLE_EVIDENCE: Exclude<Evidence, { status: "current" }> =
  Object.freeze({
    status: "unsupported",
    basis: "none",
    receivedAt: null,
    reason: "source-unavailable",
  });

/** Evidence for a fact the source cannot observe at all. */
export const UNSUPPORTED_EVIDENCE: Evidence = Object.freeze({
  status: "unsupported",
  basis: "none",
  receivedAt: null,
  reason: "unsupported",
});

/**
 * Every fact unknown and unobserved: each Reach's first snapshot, and the one
 * a server render and hydration read. Frozen, deterministic and safe to share.
 *
 * @example
 * ```ts
 * const getServerSnapshot = () => UNKNOWN_NETWORK_STATE;
 * ```
 */
export const UNKNOWN_NETWORK_STATE: NetworkState = Object.freeze({
  revision: 0,
  generation: 0,
  connection: Object.freeze({
    status: "unknown",
    type: "unknown",
    transports: null,
  }),
  internet: Object.freeze({ status: "unknown" }),
  cost: Object.freeze({ metered: null, expensive: null }),
  preferences: Object.freeze({ constrained: null, saveData: null }),
  evidence: Object.freeze({
    "connection.status": UNOBSERVED_EVIDENCE,
    "connection.type": UNOBSERVED_EVIDENCE,
    "connection.transports": UNOBSERVED_EVIDENCE,
    "internet.status": UNOBSERVED_EVIDENCE,
    "cost.metered": UNOBSERVED_EVIDENCE,
    "cost.expensive": UNOBSERVED_EVIDENCE,
    "preferences.constrained": UNOBSERVED_EVIDENCE,
    "preferences.saveData": UNOBSERVED_EVIDENCE,
  }),
});

/** The eight normalized fact paths, in the order the state declares them. */
export const NETWORK_FIELDS: NetworkField[] = freezeList([
  "connection.status",
  "connection.type",
  "connection.transports",
  "internet.status",
  "cost.metered",
  "cost.expensive",
  "preferences.constrained",
  "preferences.saveData",
]);
