import type { ObservationInput } from "src/mock/types/ObservationInput";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";

/**
 * How a mock source behaves: whether its host has it at all, what it
 * reports before anything else, whether `open` answers at once or waits for
 * `resolveOpen()`, and whether a refresh reports again at once, waits for
 * `resolveRefresh()`, or is missing.
 *
 * @example
 * ```ts
 * const options: MockNetworkOptions = { open: "held", refresh: "none" };
 * ```
 */
export type MockNetworkOptions = {
  /** Whether the host has the source, `true` by default; `false` behaves like a server render. */
  available?: boolean;
  /** The source's first report, which a session reads while it opens until a later one replaces it; nothing is reported when left out. */
  initial?: ObservationInput;
  capabilities?: NetworkCapabilities;
  open?: "sync" | "held";
  refresh?: "auto" | "held" | "none";
};
