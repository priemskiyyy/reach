import { connectionOf } from "src/world/connectionOf.fixture";
import type { Epoch } from "src/world/types/Epoch";
import type { Expected } from "src/world/types/Expected";
import type { WorldEntry } from "src/world/types/WorldEntry";

/**
 * What the world says Reach was told, in the order Reach must apply it: an
 * event takes the place of its delivery, a read the place where it began, and
 * a session boundary or a gap ends everything that began before it.
 */
export const replayLog = (log: WorldEntry[]) => {
  const epochs: Epoch[] = [];
  let expected: Expected = { kind: "none" };
  let session = false;
  let committed = 0;
  let epoch = 0;
  let accepted = new Set<number>();

  for (const entry of log) {
    if (entry.kind === "open") {
      session = true;
      committed = entry.order;
      expected = { kind: "none" };
      accepted = new Set();
      epoch += 1;
    } else if (entry.kind === "close") {
      session = false;
      expected = { kind: "stale" };
      epoch += 1;
    } else if (entry.kind === "gap") {
      committed = entry.order;
      expected = { kind: "stale" };
      epoch += 1;
    } else if (entry.kind === "mark") {
      if (entry.name === "foreground") {
        epoch += 1;
      }
    } else if (
      entry.kind === "report" &&
      entry.via !== "late-read" &&
      session &&
      entry.key > committed
    ) {
      const next: Expected = { kind: "truth", truth: entry.truth };

      committed = entry.key;

      if (connectionOf(expected) !== connectionOf(next)) {
        epoch += 1;
      }

      expected = next;
      accepted.add(entry.wall);
    }

    epochs.push({ order: entry.order, epoch });
  }

  return { expected, epoch, epochs, accepted };
};
