import type { MockNetworkStats } from "src/mock/types/MockNetworkStats";
import type { ObservationInput } from "src/mock/types/ObservationInput";
import type { NetworkAdapter } from "src/types/NetworkAdapter";

/**
 * A scriptable connectivity source and the adapter over it. Each report
 * changes the source and reaches the open session, if there is one; the next
 * session reads it. `unsafe` reaches a closed one on purpose, to prove that
 * Reach ignores it.
 *
 * @example
 * ```ts
 * const mock: MockNetwork = createMockNetwork();
 *
 * mock.emit({ connection: { status: observed("connected") } });
 * ```
 */
export type MockNetwork = {
  adapter: NetworkAdapter<{ session: number }>;
  emit: (input?: ObservationInput) => void;
  /** Reserves a place in the order, for a read that reports later. */
  reserve: () => {
    emit: (input?: ObservationInput) => void;
    reportError: (error: unknown) => void;
  };
  invalidate: () => void;
  reportError: (error: unknown) => void;
  /** Answers the oldest held `open` with its session. */
  resolveOpen: () => void;
  /** Rejects the oldest held `open`. */
  rejectOpen: (error: unknown) => void;
  /** Makes the next `open` register its cleanup and then throw. */
  failNextOpen: (error: unknown) => void;
  /** Answers the oldest held refresh, reporting `input` unless it is left out. */
  resolveRefresh: (input?: ObservationInput) => void;
  rejectRefresh: (error: unknown) => void;
  stats: () => MockNetworkStats;
  unsafe: {
    /** Reports through the latest session's context, even after it closed. */
    emitAfterClose: (input?: ObservationInput) => void;
  };
};
