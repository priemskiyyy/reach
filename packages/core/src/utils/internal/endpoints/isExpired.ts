import type { Completion } from "src/types/internal/Completion";
import type { ReachClock } from "src/types/ReachClock";
import { CLOCK_SKEW_TOLERANCE } from "src/utils/constants/defaults";

/**
 * Whether a result completed at `completion` is past `staleAfter` on either
 * clock. Clocks that disagree mean a sleep or a correction happened, and
 * that ends the result instead of extending it.
 */
export const isExpired = (
  completion: Completion,
  staleAfter: number,
  clock: ReachClock,
) => {
  const monotonicElapsed = clock.monotonic() - completion.monotonic;
  const wallElapsed = clock.now() - completion.wall;

  if (Math.max(monotonicElapsed, wallElapsed) >= staleAfter) {
    return true;
  }

  return Math.abs(wallElapsed - monotonicElapsed) > CLOCK_SKEW_TOLERANCE;
};
