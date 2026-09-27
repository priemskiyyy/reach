import type { MockProbeCall } from "src/mock/types/MockProbeCall";
import type { EndpointDefinition } from "src/types/EndpointDefinition";

/**
 * A scriptable endpoint check and its definition. Every call waits until the
 * test settles it, the oldest first with `pass`, `fail` and `inconclusive`,
 * or any one of them through `calls`.
 *
 * @example
 * ```ts
 * const probe: MockEndpoint = createMockEndpoint({ staleAfter: 30_000 });
 *
 * probe.pass();
 * ```
 */
export type MockEndpoint = {
  definition: EndpointDefinition;
  /** Every call so far, in order. */
  calls: MockProbeCall[];
  pass: () => void;
  fail: (reason?: string) => void;
  inconclusive: (reason?: string) => void;
  /** Makes the next call throw at once, as a broken check does. */
  throwNext: (error: unknown) => void;
  /** Calls not settled yet. */
  pending: () => number;
};
