import type { DiagnosticDetails } from "src/types/internal/DiagnosticDetails";
import type { NetworkState } from "src/types/NetworkState";
import type { ReachClock } from "src/types/ReachClock";
import type { ReachDiagnosticEventType } from "src/types/ReachDiagnosticEventType";
import type { RefreshResult } from "src/types/RefreshResult";
import type { Listeners } from "src/utils/internal/observable/Listeners";
import type { DeadlineScheduler } from "src/utils/internal/scheduling/DeadlineScheduler";

// What every endpoint of one Reach shares.
export type EndpointEnvironment = {
  clock: ReachClock;
  scheduler: DeadlineScheduler;
  network: {
    getState: () => NetworkState;
    isRunning: () => boolean;
    isDisposed: () => boolean;
    whenRunning: (signal?: AbortSignal) => Promise<void>;
    advanceGeneration: () => void;
    refresh: () => Promise<RefreshResult>;
  };
  /** Checks physically running, abandoned ones included, and the most allowed. */
  capacity: { outstanding: number; detached: number; max: number };
  nextCheckId: () => number;
  record: (type: ReachDiagnosticEventType, details?: DiagnosticDetails) => void;
  /** Marks the diagnostic snapshot outdated after a change no event records. */
  changed: () => void;
  createListeners: () => Listeners;
  /** Counts and rethrows an application listener's or subscription's error outside the caller. */
  reportListenerError: (error: unknown) => void;
  /** Counts and rethrows a cleanup's error outside the caller. */
  reportCleanupError: (error: unknown) => void;
};
