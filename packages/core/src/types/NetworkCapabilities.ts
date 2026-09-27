import type { FieldCapability } from "src/types/FieldCapability";
import type { NetworkField } from "src/types/NetworkField";

/**
 * What the opened source can observe, declared by its adapter: one capability
 * per fact, whether Reach owns the source or borrows the application's,
 * whether it can tell one route from another, and whether the provider sends
 * requests of its own that Reach does not control.
 *
 * @example
 * ```ts
 * const capabilities = reach.capabilities.get();
 *
 * if (capabilities?.upstreamActivity === "provider-controlled") {
 *   console.info("The provider may check reachability on its own.");
 * }
 * ```
 */
export type NetworkCapabilities = {
  fields: Record<NetworkField, FieldCapability>;
  ownership: "owned" | "borrowed";
  routeIdentity: "identified" | "coarse" | "unknown";
  upstreamActivity: "none" | "provider-controlled" | "unknown";
};
