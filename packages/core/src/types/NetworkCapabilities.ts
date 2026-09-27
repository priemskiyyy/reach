import type { FieldCapability } from "src/types/FieldCapability";
import type { NetworkField } from "src/types/NetworkField";

/**
 * What the opened source can observe, declared by its adapter once per
 * session: one capability per fact.
 *
 * @example
 * ```ts
 * const capabilities = reach.capabilities.get();
 *
 * if (capabilities?.["cost.metered"].support === "unsupported") {
 *   console.info("This source cannot tell a metered network apart.");
 * }
 * ```
 */
export type NetworkCapabilities = Record<NetworkField, FieldCapability>;
