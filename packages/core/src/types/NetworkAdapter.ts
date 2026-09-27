import type { NetworkAdapterContext } from "src/types/NetworkAdapterContext";
import type { NetworkSession } from "src/types/NetworkSession";

/**
 * A plain `{ name, open }` over one connectivity source. `open` subscribes
 * first, then reads, and answers the session or throws; Reach opens it once
 * per runtime session and never calls it again after that session ends.
 *
 * @example
 * ```ts
 * const adapter: NetworkAdapter<null> = {
 *   name: "always-unknown",
 *   open: () => ({ native: null, capabilities }),
 * };
 * ```
 */
export type NetworkAdapter<TNative> = {
  name: string;
  open: (
    context: NetworkAdapterContext,
  ) => NetworkSession<TNative> | Promise<NetworkSession<TNative>>;
};
