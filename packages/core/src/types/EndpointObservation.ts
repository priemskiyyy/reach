import type { ProbeResponse } from "src/types/ProbeResponse";
import type { ProbeVerdict } from "src/types/ProbeVerdict";

/**
 * One accepted check result: what it concluded, when it ran, and the network
 * generation it belongs to. It stays visible after it expires, as history,
 * until a scope change or disposal clears it.
 *
 * @example
 * ```ts
 * const observation = api.state.get().lastObservation;
 * ```
 */
export type EndpointObservation = {
  check: { id: number };
  verdict: ProbeVerdict;
  response: ProbeResponse;
  reason: string | null;
  /** Epoch milliseconds when the check began. */
  startedAt: number;
  /** Epoch milliseconds when the result was accepted; freshness counts from here. */
  completedAt: number;
  networkGeneration: number;
};
