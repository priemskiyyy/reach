import type { NetworkObservation } from "src/types/NetworkObservation";

/**
 * A partial observation for tests: every fact left out is reported
 * `unknown`, never carried over from an earlier report.
 *
 * @example
 * ```ts
 * const input: ObservationInput = { connection: { status: observed("connected") } };
 * ```
 */
export type ObservationInput = {
  connection?: Partial<NetworkObservation["connection"]>;
  internet?: Partial<NetworkObservation["internet"]>;
  cost?: Partial<NetworkObservation["cost"]>;
  preferences?: Partial<NetworkObservation["preferences"]>;
};
