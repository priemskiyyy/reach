import type { ConnectionStatus } from "src/types/ConnectionStatus";
import type { ConnectionType } from "src/types/ConnectionType";
import type { Evidence } from "src/types/Evidence";
import type { InternetStatus } from "src/types/InternetStatus";
import type { NetworkField } from "src/types/NetworkField";
import type { Transport } from "src/types/Transport";

/**
 * One frozen snapshot of the normalized network facts and their evidence. A
 * fact without current evidence is `unknown` or `null`, never `false`, and
 * the snapshot keeps its identity until something meaningful changes.
 *
 * @example
 * ```ts
 * const { connection, internet, cost, evidence } = reach.state.get();
 * ```
 */
export type NetworkState = {
  /** Grows with every meaningful change of this snapshot. */
  revision: number;
  /** Grows with every observed route change or observation gap; not a network identifier. */
  generation: number;
  connection: {
    status: ConnectionStatus;
    type: ConnectionType;
    /** Every link the source reports at once, or `null` when it cannot report the whole set. */
    transports: Transport[] | null;
  };
  internet: {
    status: InternetStatus;
  };
  cost: {
    metered: boolean | null;
    expensive: boolean | null;
  };
  preferences: {
    /** A user-controlled low data mode, which is neither metering nor expense. */
    constrained: boolean | null;
    saveData: boolean | null;
  };
  evidence: Record<NetworkField, Evidence>;
};
