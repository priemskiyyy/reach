import type { ObservationInput } from "src/mock/types/ObservationInput";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";

/**
 * How a mock source behaves: what each session reports while it opens,
 * whether `open` answers at once or waits for `resolveOpen()`, and whether a
 * refresh reports again at once, waits for `resolveRefresh()`, or is missing.
 *
 * @example
 * ```ts
 * const options: MockNetworkOptions = { open: "held", refresh: "none" };
 * ```
 */
export type MockNetworkOptions = {
  /** Reported by each session while it opens; nothing is reported when left out. */
  initial?: ObservationInput;
  capabilities?: NetworkCapabilities;
  open?: "sync" | "held";
  refresh?: "auto" | "held" | "none";
};
