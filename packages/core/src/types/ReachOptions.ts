import type { Activity } from "src/types/Activity";
import type { EndpointDefinition } from "src/types/EndpointDefinition";
import type { NetworkAdapter } from "src/types/NetworkAdapter";
import type { ObservableValue } from "src/types/ObservableValue";
import type { ReachClock } from "src/types/ReachClock";

/**
 * What one Reach observes: exactly one adapter, the endpoints it may check by
 * name, and where the application's foreground activity comes from. Every
 * field is read once, at construction, and nothing starts until `start()`.
 *
 * @example
 * ```ts
 * const options: ReachOptions<null, Record<never, EndpointDefinition>> = {
 *   adapter,
 *   timeouts: { open: 5_000 },
 * };
 * ```
 */
export type ReachOptions<
  TNative,
  TEndpoints extends Record<string, EndpointDefinition>,
> = {
  adapter: NetworkAdapter<TNative>;
  endpoints?: TEndpoints;
  /** Admits automatic checks only in the foreground; without it, they run whenever the runtime does. */
  activity?: ObservableValue<Activity>;
  timeouts?: {
    /** Milliseconds the adapter may take to open, 10,000 by default. */
    open?: number;
    /** Milliseconds one source refresh may take, 10,000 by default. */
    refresh?: number;
  };
  /** Checks that may run physically at once, including abandoned ones that ignore abort, 4 by default. */
  maxOutstandingChecks?: number;
  clock?: ReachClock;
};
