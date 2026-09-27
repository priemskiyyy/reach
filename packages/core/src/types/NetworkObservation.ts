import type { ConnectionType } from "src/types/ConnectionType";
import type { FieldObservation } from "src/types/FieldObservation";
import type { Transport } from "src/types/Transport";

/**
 * One complete report from a source: every fact, each with its own evidence.
 * It replaces the previous report as a whole, so a fact left unknown never
 * inherits an older value. `route` tells Reach about a route change the coarse
 * facts cannot show.
 *
 * @example
 * ```ts
 * const unsupported = { status: "unsupported" } satisfies FieldObservation<never>;
 * const observation: NetworkObservation = {
 *   connection: {
 *     status: { status: "current", value: "connected", basis: "browser-hint" },
 *     type: { status: "unknown" },
 *     transports: unsupported,
 *   },
 *   internet: { status: unsupported },
 *   cost: { metered: unsupported, expensive: unsupported },
 *   preferences: { constrained: unsupported, saveData: unsupported },
 * };
 * ```
 */
export type NetworkObservation = {
  connection: {
    status: FieldObservation<"connected" | "disconnected">;
    type: FieldObservation<Exclude<ConnectionType, "unknown">>;
    transports: FieldObservation<Transport[]>;
  };
  internet: {
    status: FieldObservation<"online" | "offline">;
  };
  cost: {
    metered: FieldObservation<boolean>;
    expensive: FieldObservation<boolean>;
  };
  preferences: {
    constrained: FieldObservation<boolean>;
    saveData: FieldObservation<boolean>;
  };
  route?: {
    /** An opaque key for the current route, local to this session; never an SSID or an address. */
    key?: string | number;
    /** The source knows the route changed even though the coarse facts did not. */
    changed?: boolean;
  };
};
