import type { ExpoNetworkLike } from "src/types/ExpoNetworkLike";
import type { ExpoNetworkStateLike } from "src/types/ExpoNetworkStateLike";

export const WIFI_STATE: ExpoNetworkStateLike = {
  type: "WIFI",
  isConnected: true,
  isInternetReachable: true,
};

export const CELLULAR_STATE: ExpoNetworkStateLike = {
  type: "CELLULAR",
  isConnected: true,
  isInternetReachable: true,
};

// What both platforms answer without a path, and iOS also after its read times out.
export const NO_PATH_STATE: ExpoNetworkStateLike = {
  type: "NONE",
  isConnected: false,
  isInternetReachable: false,
};

// Android's answer after an exception it swallows.
export const FAILED_READ_STATE: ExpoNetworkStateLike = {
  type: "UNKNOWN",
  isConnected: false,
  isInternetReachable: false,
};

// Modeled on expo-network 58.0.1: a listener hears changes only, and a read
// answers the current state.
export const createFakeExpoNetwork = (
  initial: ExpoNetworkStateLike = WIFI_STATE,
) => {
  const listeners = new Set<(state: ExpoNetworkStateLike) => void>();

  const heldReads: Array<{
    resolve: (state: ExpoNetworkStateLike) => void;
    reject: (error: Error) => void;
  }> = [];

  const calls = { reads: 0, ipAddress: 0 };
  const behavior = { holdRead: false };

  let current = initial;

  const sdk = {
    addNetworkStateListener: (
      listener: (state: ExpoNetworkStateLike) => void,
    ) => {
      listeners.add(listener);

      return {
        remove: () => {
          listeners.delete(listener);
        },
      };
    },
    getNetworkStateAsync: () => {
      calls.reads += 1;

      if (!behavior.holdRead) {
        return Promise.resolve(current);
      }

      return new Promise<ExpoNetworkStateLike>((resolve, reject) => {
        heldReads.push({ resolve, reject });
      });
    },
    // Present, as on the real module, so a test can prove it is never called.
    getIpAddressAsync: () => {
      calls.ipAddress += 1;

      return Promise.resolve("0.0.0.0");
    },
  } satisfies ExpoNetworkLike & { getIpAddressAsync: () => Promise<string> };

  return {
    sdk,
    calls,
    behavior,
    answer: (state: ExpoNetworkStateLike) => {
      current = state;
    },
    emit: (state: ExpoNetworkStateLike) => {
      current = state;

      for (const listener of [...listeners]) {
        listener(state);
      }
    },
    resolveRead: (state: ExpoNetworkStateLike) => {
      const held = heldReads.shift();

      if (held === undefined) {
        throw new Error("No read is held.");
      }

      held.resolve(state);
    },
    rejectRead: (error: Error) => {
      const held = heldReads.shift();

      if (held === undefined) {
        throw new Error("No read is held.");
      }

      held.reject(error);
    },
    listenerCount: () => listeners.size,
  };
};
