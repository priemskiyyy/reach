import { createTestClock } from "src/mock/createTestClock";
import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import type { NetworkAdapter } from "src/types/NetworkAdapter";
import type { NetworkAdapterContext } from "src/types/NetworkAdapterContext";
import { observeTruth } from "src/world/observeTruth.fixture";
import type { Truth } from "src/world/types/Truth";
import type { WorldEntry } from "src/world/types/WorldEntry";
import type { WorldMark } from "src/world/types/WorldMark";

/**
 * A fake operating system. It owns the truth and changes it between steps,
 * with or without telling the open session, and logs every report it sends so
 * an oracle can derive its expectation from the world instead of from Reach.
 * A read samples the truth when it begins, as a held native read does.
 */
export const createWorld = (initial: Truth) => {
  const clock = createTestClock({ now: 1_000 });
  const log: WorldEntry[] = [];
  const heldReads: Array<() => void> = [];
  let truth = initial;
  let order = 0;
  let open: NetworkAdapterContext | null = null;
  let closed: NetworkAdapterContext | null = null;
  let holdReads = false;
  let sessions = 0;

  const tick = () => {
    order += 1;

    return order;
  };

  const sendEvent = (context: NetworkAdapterContext) => {
    const delivered = tick();

    log.push({
      kind: "report",
      order: delivered,
      key: delivered,
      via: "event",
      truth,
      wall: clock.now(),
    });
    context.emit(observeTruth(truth));
  };

  const adapter: NetworkAdapter<null> = {
    name: "world",
    available: () => true,
    open: (context) => {
      sessions += 1;
      open = context;
      log.push({ kind: "open", order: tick(), wall: clock.now() });
      context.onDispose(() => {
        log.push({ kind: "close", order: tick() });
        closed = context;

        if (open === context) {
          open = null;
        }
      });

      // NetInfo announces its latest state to a new listener at once.
      sendEvent(context);

      return {
        native: null,
        capabilities: MOCK_CAPABILITIES,
        refresh: ({ emit, signal }) => {
          const key = tick();
          const sampled = truth;

          // The adapter still answers a read Reach gave up on, as a native call does.
          const answer = () => {
            log.push({
              kind: "report",
              order: tick(),
              key,
              via: signal.aborted ? "late-read" : "read",
              truth: sampled,
              wall: clock.now(),
            });
            emit(observeTruth(sampled));
          };

          // A native read always answers on a later turn, even when it is not held.
          return new Promise<void>((resolve) => {
            const finish = () => {
              answer();
              resolve();
            };

            if (holdReads) {
              heldReads.push(finish);

              return;
            }

            queueMicrotask(finish);
          });
        },
      };
    },
  };

  return {
    adapter,
    clock,
    log,
    truth: () => truth,
    sessions: () => sessions,
    isOpen: () => open !== null,
    heldReads: () => heldReads.length,
    isHolding: () => holdReads,
    /** The truth changes; an open session hears it only when `notify` says so. */
    change: (next: Truth, { notify }: { notify: boolean }) => {
      truth = next;

      if (notify && open !== null) {
        sendEvent(open);
      }
    },
    /** What the application or the checks did, in the world's order and on its clocks. */
    mark: (name: WorldMark, detail = "") => {
      const at = tick();

      log.push({
        kind: "mark",
        order: at,
        name,
        detail,
        mono: clock.monotonic(),
        wall: clock.now(),
      });

      return at;
    },
    /** A page hide or a freeze: the source says it may have missed changes. */
    gap: () => {
      if (open === null) {
        return;
      }

      log.push({ kind: "gap", order: tick() });
      open.invalidate();
    },
    /** From now on a refresh waits until `release` answers it with what it sampled. */
    hold: (held: boolean) => {
      holdReads = held;
    },
    release: () => {
      heldReads.shift()?.();
    },
    /** An event through a session that already closed, as a late native callback is. */
    lateEvent: () => {
      closed?.emit(observeTruth(truth));
    },
  };
};
