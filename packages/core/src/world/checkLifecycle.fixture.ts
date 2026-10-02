import { flagViolation } from "src/world/flagViolation.fixture";
import type { Rig } from "src/world/types/Rig";
import type { Step } from "src/world/types/Step";

/** The state never goes back, a disposed runtime never moves, and the source is open only while leased. */
export const checkLifecycle = (rig: Rig, step: Step) => {
  const { world, reach } = rig;
  const state = reach.state.get();

  if (
    state.revision < rig.previous.revision ||
    state.generation < rig.previous.generation
  ) {
    flagViolation(
      rig,
      "state.went-backwards",
      `${rig.previous.revision} -> ${state.revision}`,
    );
  }

  rig.previous = state;

  if (step.kind === "dispose") {
    rig.disposedState = state;
  }

  if (rig.disposed && state !== rig.disposedState) {
    flagViolation(
      rig,
      "dispose.state-moved",
      "the state changed after dispose",
    );
  }

  if (rig.disposed && world.clock.pendingTimers() !== 0) {
    flagViolation(
      rig,
      "dispose.timer-left",
      `${world.clock.pendingTimers()} timers`,
    );
  }

  if (world.isOpen() !== (rig.lease !== null && !rig.disposed)) {
    flagViolation(
      rig,
      "lifecycle.session",
      `open ${world.isOpen()}, leased ${rig.lease !== null}`,
    );
  }
};
