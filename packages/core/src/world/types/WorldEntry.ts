import type { Truth } from "src/world/types/Truth";
import type { WorldMark } from "src/world/types/WorldMark";

/**
 * What the world did, in order. `key` is the place a report takes in the
 * source's order: an event's is its delivery, a read's is the moment it began.
 * A `late-read` answered after Reach had given the read up, so it is owed no
 * place at all.
 */
export type WorldEntry =
  | { kind: "open"; order: number; wall: number }
  | { kind: "close"; order: number }
  | { kind: "gap"; order: number }
  | {
      kind: "report";
      order: number;
      key: number;
      via: "event" | "read" | "late-read";
      truth: Truth;
      wall: number;
    }
  | {
      kind: "mark";
      order: number;
      name: WorldMark;
      detail: string;
      mono: number;
      wall: number;
    };
