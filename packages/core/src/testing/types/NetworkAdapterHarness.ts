import type { NetworkAdapter } from "src/types/NetworkAdapter";

/**
 * A controllable host for the conformance suite, fake or real, created fresh
 * for each check: the adapter over it, a way to make the host report a
 * change the adapter observes, and a count of the subscriptions the adapter
 * holds on it right now.
 *
 * @example
 * ```ts
 * const createHarness = (): NetworkAdapterHarness => {
 *   const host = createFakeHost();
 *
 *   return {
 *     adapter: fromHost(host),
 *     change: () => host.toggle(),
 *     settle: () => Promise.resolve(),
 *     subscriptionCount: () => host.listenerCount(),
 *   };
 * };
 * ```
 */
export type NetworkAdapterHarness = {
  adapter: NetworkAdapter<unknown>;
  /** Makes the host report a different connection, which the adapter must report. */
  change: () => void | Promise<void>;
  /** Resolves once the host has delivered everything it queued. */
  settle: () => Promise<void>;
  subscriptionCount: () => number;
};
