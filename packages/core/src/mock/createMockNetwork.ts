import { createObservation } from "src/mock/createObservation";
import type { MockNetwork } from "src/mock/types/MockNetwork";
import type { MockNetworkOptions } from "src/mock/types/MockNetworkOptions";
import type { ObservationInput } from "src/mock/types/ObservationInput";
import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import type { NetworkAdapterContext } from "src/types/NetworkAdapterContext";
import type { NetworkObservation } from "src/types/NetworkObservation";
import type { NetworkSession } from "src/types/NetworkSession";
import type { RefreshRequest } from "src/types/RefreshRequest";

type Native = { session: number };

type HeldOpen = {
  resolve: (session: NetworkSession<Native>) => void;
  reject: (error: unknown) => void;
  session: NetworkSession<Native>;
};

type HeldRefresh = {
  request: RefreshRequest;
  resolve: () => void;
  reject: (error: unknown) => void;
};

/**
 * A well-behaved adapter over a scriptable source, for tests. Every session
 * registers one cleanup, reports the source's latest report while it opens,
 * `initial` at first, and reports nothing else until the test says so.
 *
 * @example
 * ```ts
 * const mock = createMockNetwork({ initial: { connection: { status: observed("connected") } } });
 * const reach = new Reach({ adapter: mock.adapter });
 * const lease = reach.start();
 *
 * mock.emit({ connection: { status: observed("disconnected") } });
 * lease.release();
 * mock.stats().activeSessions; // 0
 * ```
 */
export const createMockNetwork = ({
  available = true,
  initial,
  capabilities = MOCK_CAPABILITIES,
  open = "sync",
  refresh = "auto",
}: MockNetworkOptions = {}): MockNetwork => {
  let opens = 0;
  let cleanups = 0;
  let refreshes = 0;
  let latest: NetworkAdapterContext | null = null;
  let active: NetworkAdapterContext | null = null;
  let current: NetworkObservation = createObservation(initial);
  let reported = initial !== undefined;
  let nextFailure: { error: unknown } | null = null;
  const heldOpens: HeldOpen[] = [];
  const heldRefreshes: HeldRefresh[] = [];

  const getLatest = () => {
    if (latest === null) {
      throw new Error("The mock network has not been opened yet.");
    }

    return latest;
  };

  const report = (input?: ObservationInput) => {
    current = createObservation(input);
    reported = true;

    return current;
  };

  const handleRefresh = (request: RefreshRequest) => {
    refreshes += 1;

    if (refresh === "held") {
      return new Promise<void>((resolve, reject) => {
        heldRefreshes.push({ request, resolve, reject });
      });
    }

    request.emit(current);
  };

  const createSession = (): NetworkSession<Native> => ({
    native: Object.freeze({ session: opens }),
    capabilities,
    ...(refresh === "none" ? {} : { refresh: handleRefresh }),
  });

  return Object.freeze({
    adapter: Object.freeze({
      name: "mock",
      available: () => available,
      open: (context: NetworkAdapterContext) => {
        opens += 1;
        latest = context;
        active = context;
        context.onDispose(() => {
          cleanups += 1;

          if (active === context) {
            active = null;
          }
        });

        const failure = nextFailure;

        nextFailure = null;

        if (failure !== null) {
          throw failure.error;
        }

        // A new session reads the source as it is now.
        if (reported) {
          context.emit(current);
        }

        const session = createSession();

        if (open === "sync") {
          return session;
        }

        return new Promise<NetworkSession<Native>>((resolve, reject) => {
          heldOpens.push({ resolve, reject, session });
        });
      },
    }),
    // The source changes whether or not a session is open; only an open one hears it.
    emit: (input?: ObservationInput) => {
      const observation = report(input);

      active?.emit(observation);
    },
    // A read reaches the session it began in, and only while that session is open.
    reserve: () => {
      const context = active;
      const slot = context?.reserve() ?? null;

      return {
        emit: (input?: ObservationInput) => {
          const observation = report(input);

          if (slot === null || active !== context) {
            return;
          }

          slot.emit(observation);
        },
        reportError: (error: unknown) => {
          if (slot === null || active !== context) {
            return;
          }

          slot.reportError(error);
        },
      };
    },
    invalidate: () => {
      active?.invalidate();
    },
    reportError: (error: unknown) => {
      active?.reportError(error);
    },
    resolveOpen: () => {
      const held = heldOpens.shift();

      if (held === undefined) {
        throw new Error("No open is held.");
      }

      held.resolve(held.session);
    },
    rejectOpen: (error: unknown) => {
      const held = heldOpens.shift();

      if (held === undefined) {
        throw new Error("No open is held.");
      }

      held.reject(error);
    },
    failNextOpen: (error: unknown) => {
      nextFailure = { error };
    },
    resolveRefresh: (input?: ObservationInput) => {
      const held = heldRefreshes.shift();

      if (held === undefined) {
        throw new Error("No refresh is held.");
      }

      if (input !== undefined) {
        held.request.emit(report(input));
      }

      held.resolve();
    },
    rejectRefresh: (error: unknown) => {
      const held = heldRefreshes.shift();

      if (held === undefined) {
        throw new Error("No refresh is held.");
      }

      held.reject(error);
    },
    stats: () =>
      Object.freeze({
        opens,
        cleanups,
        activeSessions: opens - cleanups,
        refreshes,
      }),
    unsafe: Object.freeze({
      emitAfterClose: (input?: ObservationInput) => {
        getLatest().emit(report(input));
      },
    }),
  });
};
