import type { NetInfoLike } from "src/types/NetInfoLike";
import type { NetInfoStateLike } from "src/types/NetInfoStateLike";

export const WIFI_STATE: NetInfoStateLike = {
  type: "wifi",
  isConnected: true,
  isInternetReachable: true,
  details: { isConnectionExpensive: false },
};

export const CELLULAR_STATE: NetInfoStateLike = {
  type: "cellular",
  isConnected: true,
  isInternetReachable: true,
  details: { isConnectionExpensive: true },
};

// Modeled on NetInfo 12.0.1: a new listener hears the latest known state at
// once, inside addEventListener, and fetch answers the current state.
export const createFakeNetInfo = (initial: NetInfoStateLike = WIFI_STATE) => {
  const listeners = new Set<(state: NetInfoStateLike) => void>();

  const heldFetches: Array<{
    resolve: (state: NetInfoStateLike) => void;
    reject: (error: Error) => void;
  }> = [];

  const calls = { configure: 0, refresh: 0 };
  const behavior = { holdFetch: false, announceOnSubscribe: true };

  let current = initial;

  const sdk = {
    addEventListener: (listener: (state: NetInfoStateLike) => void) => {
      listeners.add(listener);

      if (behavior.announceOnSubscribe) {
        listener(current);
      }

      return () => {
        listeners.delete(listener);
      };
    },
    fetch: () => {
      if (!behavior.holdFetch) {
        return Promise.resolve(current);
      }

      return new Promise<NetInfoStateLike>((resolve, reject) => {
        heldFetches.push({ resolve, reject });
      });
    },
    refresh: () => {
      calls.refresh += 1;

      return Promise.resolve(current);
    },
    // Present, as on the real module, so a test can prove it is never called.
    configure: () => {
      calls.configure += 1;
    },
  } satisfies NetInfoLike & { configure: () => void };

  return {
    sdk,
    calls,
    behavior,
    emit: (state: NetInfoStateLike) => {
      current = state;

      for (const listener of [...listeners]) {
        listener(state);
      }
    },
    resolveFetch: (state: NetInfoStateLike) => {
      const held = heldFetches.shift();

      if (held === undefined) {
        throw new Error("No fetch is held.");
      }

      held.resolve(state);
    },
    rejectFetch: (error: Error) => {
      const held = heldFetches.shift();

      if (held === undefined) {
        throw new Error("No fetch is held.");
      }

      held.reject(error);
    },
    listenerCount: () => listeners.size,
  };
};
