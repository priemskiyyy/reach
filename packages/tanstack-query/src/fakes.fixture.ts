import type { Condition, ConditionStatus } from "@priemskiyyy/reach";

import type { OnlineEventListener } from "src/types/OnlineEventListener";

/**
 * A condition the test sets by hand. Notification walks a copy of the
 * listeners, as an in-flight pass does, and `onSubscribe` runs right after a
 * listener is added.
 */
export const createFakeCondition = (initial: ConditionStatus) => {
  const listeners = new Set<() => void>();
  const hooks = { onSubscribe: () => {} };

  let status = initial;

  const condition: Condition = {
    get: () => ({ status, reasons: [] }),
    subscribe: (listener) => {
      listeners.add(listener);
      hooks.onSubscribe();

      return () => {
        listeners.delete(listener);
      };
    },
  };

  return {
    condition,
    hooks,
    set: (next: ConditionStatus) => {
      status = next;

      for (const listener of [...listeners]) {
        listener();
      }
    },
    listenerCount: () => listeners.size,
  };
};

// Modeled on query-core 5.104's online manager: installing runs the previous
// cleanup first. It records every call, where the real one drops repeats.
export const createFakeOnlineManager = () => {
  const calls: boolean[] = [];

  const hooks: { onSetOnline: (online: boolean) => void } = {
    onSetOnline: () => {},
  };

  let cleanup: (() => void) | undefined;

  return {
    calls,
    hooks,
    setEventListener: (setup: OnlineEventListener) => {
      cleanup?.();
      cleanup = setup((online) => {
        calls.push(online);
        hooks.onSetOnline(online);
      });
    },
  };
};
