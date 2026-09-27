import type { NetworkAdapterContext } from "src/types/NetworkAdapterContext";
import type { NetworkSession } from "src/types/NetworkSession";

/**
 * A plain `{ name, available, open }` over one connectivity source.
 * `available` says whether this host has the source at all; `open` subscribes
 * first, then reads, and answers the session or throws. Reach opens it once
 * per runtime session and never calls it again after that session ends.
 *
 * @example
 * ```ts
 * const adapter: NetworkAdapter<null> = {
 *   name: "always-unknown",
 *   available: () => true,
 *   open: () => ({ native: null, capabilities }),
 * };
 * ```
 */
export type NetworkAdapter<TNative> = {
  name: string;
  /** Whether this host has the source, probed cheaply before each opening; an unavailable host runs with every fact unsupported. */
  available: () => boolean;
  open: (
    context: NetworkAdapterContext,
  ) => NetworkSession<TNative> | Promise<NetworkSession<TNative>>;
};
