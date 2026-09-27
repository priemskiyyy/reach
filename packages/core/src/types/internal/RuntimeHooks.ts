import type { DiagnosticDetails } from "src/types/internal/DiagnosticDetails";
import type { ReachDiagnosticEventType } from "src/types/ReachDiagnosticEventType";
import type { Transaction } from "src/utils/internal/observable/Transaction";
import type { ReachError } from "src/utils/ReachError";

export type RuntimeHooks = {
  /** Installs what a new network generation invalidates, in the same transaction. */
  onGeneration: (transaction: Transaction) => void;
  /** Installs what stopping or disposing ends, in the same transaction; `error` is what pending work rejects with. */
  onStop: (transaction: Transaction, error: ReachError) => void;
  /** Runs once a session's first state was published. */
  onAdopt: () => void;
  /** Runs once a connection change was published. */
  onNetworkChange: () => void;
  record: (type: ReachDiagnosticEventType, details?: DiagnosticDetails) => void;
  /** Receives what a cleanup threw. */
  reportCleanupError: (error: unknown) => void;
};
