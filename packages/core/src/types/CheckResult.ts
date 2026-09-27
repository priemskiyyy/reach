import type { EndpointObservation } from "src/types/EndpointObservation";
import type { EndpointState } from "src/types/EndpointState";

/**
 * What `check()` resolves with: the accepted observation and the endpoint's
 * state at the moment it was accepted, which the next line may already find
 * outdated.
 *
 * @example
 * ```ts
 * const { observation } = await api.check();
 * ```
 */
export type CheckResult = {
  observation: EndpointObservation;
  state: EndpointState;
};
