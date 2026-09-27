import type { CheckResult } from "src/types/CheckResult";

export type CheckWaiter = {
  resolve: (result: CheckResult) => void;
  reject: (error: unknown) => void;
};

export type ProbeFlight = {
  id: number;
  controller: AbortController;
  /** Monotonic milliseconds when the check times out. */
  deadline: number;
  startedAt: number;
  networkGeneration: number;
  scopeKey: string | null;
  waiters: Set<CheckWaiter>;
  /** Whether monitoring owns it too, so it survives its last manual waiter. */
  monitored: boolean;
  /** Settled for Reach: every waiter has its answer and nothing else commits. */
  settled: boolean;
  /** The check's own promise has not settled yet, so it still holds a slot. */
  physical: boolean;
  cancelDeadline: () => void;
};
