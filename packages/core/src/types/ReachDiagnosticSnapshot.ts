import type { EndpointState } from "src/types/EndpointState";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import type { ReachDiagnosticCounters } from "src/types/ReachDiagnosticCounters";
import type { RuntimeStatus } from "src/types/RuntimeStatus";

/**
 * Who holds what right now: the runtime and its source, the leases, the
 * checks still running physically, and each endpoint's monitors, waiters and
 * status. It carries no scope key, URL or provider payload.
 *
 * @example
 * ```ts
 * const { leases, checks, endpoints } = reach.diagnostics.get();
 * ```
 */
export type ReachDiagnosticSnapshot = {
  runtime: RuntimeStatus["state"];
  adapter: { name: string };
  session: { id: number } | null;
  networkGeneration: number;
  capabilities: NetworkCapabilities | null;
  leases: number;
  checks: {
    /** Checks whose promise has not settled, abandoned ones included. */
    outstanding: number;
    /** Checks Reach stopped waiting for that still run. */
    detached: number;
  };
  endpoints: Array<{
    name: string;
    monitors: number;
    waiters: number;
    status: EndpointState["status"];
    checking: boolean;
  }>;
  counters: ReachDiagnosticCounters;
};
