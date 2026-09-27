import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import type { RefreshRequest } from "src/types/RefreshRequest";

/**
 * An opened source: the provider's own object as `native`, what it can
 * observe, and `refresh` when it can read its facts again on demand. A
 * session without `refresh` answers `reach.refresh()` with `unsupported`.
 *
 * @example
 * ```ts
 * const session: NetworkSession<typeof sdk> = {
 *   native: sdk,
 *   capabilities,
 *   refresh: async ({ emit }) => emit(toObservation(await sdk.refresh())),
 * };
 * ```
 */
export type NetworkSession<TNative> = {
  native: TNative;
  capabilities: NetworkCapabilities;
  refresh?: (request: RefreshRequest) => void | Promise<void>;
};
