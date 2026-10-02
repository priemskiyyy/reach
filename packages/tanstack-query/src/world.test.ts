import { Reach } from "@priemskiyyy/reach";
import type { ObservationInput } from "@priemskiyyy/reach/mock";
import {
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import { expect, test } from "vitest";

import { createFakeOnlineManager } from "src/fakes.fixture";
import { toOnlineEventListener } from "src/toOnlineEventListener";

// The world is what the fake source reported and whether a session was open to
// hear it. The expectation comes from that log, never from Reach's own model.
type Said = "offline" | "online" | "ambiguous" | "nothing";

type Step =
  | { kind: "report"; said: Said }
  | { kind: "gap" }
  | { kind: "lease"; to: "start" | "release" }
  | { kind: "dispose" };

const REPORTS: Record<Exclude<Said, "nothing">, ObservationInput> = {
  offline: {
    connection: { status: observed("disconnected", "native-path") },
    internet: { status: observed("offline", "native-path") },
  },
  online: {
    connection: { status: observed("connected", "native-path") },
    internet: { status: observed("online", "provider-report") },
  },
  // NetInfo's `isInternetReachable: false` while connected.
  ambiguous: {
    connection: { status: observed("connected", "native-path") },
    internet: { status: { status: "unknown", reason: "source-ambiguous" } },
  },
};

const PRNG = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
};

const flush = async () => {
  for (let turn = 0; turn < 10; turn += 1) {
    await Promise.resolve();
  }
};

const play = async (
  steps: Step[],
  unknown: "online" | "offline" | "preserve",
) => {
  const mock = createMockNetwork();
  const reach = new Reach({ adapter: mock.adapter, clock: createTestClock() });
  const manager = createFakeOnlineManager();

  manager.setEventListener(
    toOnlineEventListener(reach.condition({ internet: "online" }), { unknown }),
  );

  let lease: ReturnType<typeof reach.start> | null = null;
  let disposed = false;
  let source: Said = "nothing";
  // What the session last heard, from the world's own log.
  let heard: Said | "stale" = "stale";
  let expected: boolean | null = null;
  let frozen: boolean | null = null;

  const settle = () => {
    let wanted: boolean | null = null;

    if (heard === "offline") {
      wanted = false;
    } else if (heard === "online") {
      wanted = true;
    } else if (unknown === "online") {
      wanted = true;
    } else if (unknown === "offline") {
      wanted = false;
    }

    if (wanted !== null) {
      expected = wanted;
    }
  };

  for (const [at, step] of steps.entries()) {
    if (step.kind === "report") {
      // The source changes whether or not a session is open; only an open one hears it.
      if (step.said !== "nothing") {
        source = step.said;
        mock.emit(REPORTS[step.said]);

        if (lease !== null && !disposed) {
          heard = step.said;
        }
      }
    } else if (step.kind === "gap") {
      mock.invalidate();

      if (lease !== null && !disposed) {
        heard = "stale";
      }
    } else if (step.kind === "lease" && !disposed) {
      if (step.to === "start" && lease === null) {
        lease = reach.start();
        lease.ready.catch(() => {});
        // A new session reads the source as it is now.
        heard = source === "nothing" ? "stale" : source;
      } else if (step.to === "release" && lease !== null) {
        lease.release();
        lease = null;
        heard = "stale";
      }
    } else if (step.kind === "dispose") {
      reach.dispose();
      disposed = true;
      lease = null;
      frozen = manager.calls.at(-1) ?? null;
    }

    await flush();

    // Initial publication aside, the manager's last value follows the world.
    if (!disposed) {
      settle();
    }

    const last = manager.calls.at(-1) ?? null;

    if (disposed) {
      expect(last, `step ${at} after dispose`).toBe(frozen);
    } else if (expected !== null) {
      expect(
        last,
        `step ${at} ${JSON.stringify(step)} unknown=${unknown}`,
      ).toBe(expected);
    }

    const calls = manager.calls;

    for (let index = 1; index < calls.length; index += 1) {
      expect(calls[index], `a repeat at ${index}`).not.toBe(calls[index - 1]);
    }
  }
};

test("the online manager follows what the world said, whatever the unknown policy", async () => {
  const random = PRNG(20261002);

  for (let run = 0; run < 400; run += 1) {
    const steps: Step[] = [];

    for (let at = 0; at < 14; at += 1) {
      const roll = Math.floor(random() * 10);

      if (roll < 5) {
        const said: Said[] = ["offline", "online", "ambiguous"];

        steps.push({
          kind: "report",
          said: said[Math.floor(random() * 3)] ?? "online",
        });
      } else if (roll < 6) {
        steps.push({ kind: "gap" });
      } else if (roll < 9) {
        steps.push({ kind: "lease", to: random() < 0.5 ? "start" : "release" });
      } else if (random() < 0.15) {
        steps.push({ kind: "dispose" });
      }
    }

    const policies: Array<"online" | "offline"> = ["online", "offline"];

    for (const unknown of policies) {
      await play(steps, unknown);
    }
  }
});
