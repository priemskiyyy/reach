import type { ReachClock } from "src/types/ReachClock";
import { isolate } from "src/utils/internal/reporting/isolate";
import { reportUnhandledError } from "src/utils/internal/reporting/reportUnhandledError";

type Deadline = { at: number; run: () => void };

// Every deadline of one Reach shares one host timer, armed for the earliest;
// a timer that fires early, because the host capped its delay, is re-armed.
export class DeadlineScheduler {
  #clock: ReachClock;
  #deadlines = new Set<Deadline>();
  #armed: { at: number; cancel: () => void } | null = null;

  constructor(clock: ReachClock) {
    this.#clock = clock;
  }

  /** Runs `run` once the monotonic clock reaches `at`, and answers its cancel. */
  schedule = (at: number, run: () => void) => {
    const deadline: Deadline = { at, run };

    this.#deadlines.add(deadline);
    this.#arm();

    return () => {
      if (!this.#deadlines.delete(deadline)) {
        return;
      }

      this.#arm();
    };
  };

  #getEarliest() {
    let earliest: Deadline | null = null;

    for (const deadline of this.#deadlines) {
      if (earliest !== null && earliest.at <= deadline.at) {
        continue;
      }

      earliest = deadline;
    }

    return earliest;
  }

  #arm() {
    const earliest = this.#getEarliest();
    const armed = this.#armed;

    if (armed !== null && earliest !== null && armed.at === earliest.at) {
      return;
    }

    if (armed !== null) {
      armed.cancel();
      this.#armed = null;
    }

    if (earliest === null) {
      return;
    }

    this.#armed = {
      at: earliest.at,
      cancel: this.#clock.setTimer(
        this.#handleTimer,
        earliest.at - this.#clock.monotonic(),
      ),
    };
  }

  #handleTimer = () => {
    this.#armed = null;

    let due = this.#getDue();

    // A deadline one of these runs schedules in the past runs in this wake too.
    while (due !== null) {
      this.#deadlines.delete(due);
      // One failing deadline never leaves the rest without a timer.
      isolate(due.run, reportUnhandledError);
      due = this.#getDue();
    }

    this.#arm();
  };

  #getDue() {
    const earliest = this.#getEarliest();

    if (earliest === null) {
      return null;
    }

    if (earliest.at > this.#clock.monotonic()) {
      return null;
    }

    return earliest;
  }
}
