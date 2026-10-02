import { CLOCK_SKEW_TOLERANCE } from "src/utils/constants/defaults";
import { epochAt } from "src/world/epochAt.fixture";
import type { Epoch } from "src/world/types/Epoch";
import type { Rig } from "src/world/types/Rig";
import type { WorldEntry } from "src/world/types/WorldEntry";
import { CHECK_TIMEOUT, STALE_AFTER } from "src/world/worldConstants.fixture";

/**
 * Whether the world saw a passing check that began in this network generation,
 * answered in time and is still fresh on both clocks that agree.
 */
export const isBacked = (rig: Rig, epochs: Epoch[], epoch: number) => {
  const { log, clock } = rig.world;
  const starts = new Map<string, WorldEntry>();

  for (const entry of log) {
    if (entry.kind === "mark" && entry.name === "probe-start") {
      starts.set(entry.detail, entry);
    }
  }

  return log.some((entry) => {
    if (entry.kind !== "mark" || entry.name !== "probe-done") {
      return false;
    }

    const [call, verdict] = entry.detail.split(":");
    const start = starts.get(call ?? "");

    if (verdict !== "pass" || start === undefined || start.kind !== "mark") {
      return false;
    }

    if (entry.mono - start.mono >= CHECK_TIMEOUT) {
      return false;
    }

    if (epochAt(epochs, start.order) !== epoch) {
      return false;
    }

    const monotonicElapsed = clock.monotonic() - entry.mono;
    const wallElapsed = clock.now() - entry.wall;

    if (Math.max(monotonicElapsed, wallElapsed) >= STALE_AFTER) {
      return false;
    }

    return Math.abs(wallElapsed - monotonicElapsed) <= CLOCK_SKEW_TOLERANCE;
  });
};
