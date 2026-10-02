import { assertUnreachable } from "src/utils/internal/common/assertUnreachable";
import { flagViolation } from "src/world/flagViolation.fixture";
import { flush } from "src/world/flush.fixture";
import type { Rig } from "src/world/types/Rig";
import type { Step } from "src/world/types/Step";
import {
  MAX_OUTSTANDING,
  MIN_INTERVAL,
} from "src/world/worldConstants.fixture";
import { STRICT } from "src/world/worldSettings.fixture";

// The application's return to the foreground, then the check the world owes it.
const applyActivity = async (
  rig: Rig,
  step: Extract<Step, { kind: "activity" }>,
) => {
  const { world, reach, probe, api, activity } = rig;
  const running = rig.lease !== null && !rig.disposed;
  const returning = activity.get() !== "foreground" && step.to === "foreground";
  const before = probe.calls.length;

  const owed =
    running &&
    returning &&
    world.truth().path !== "none" &&
    world.heldReads() === 0 &&
    !world.isHolding() &&
    reach.diagnostics.get().checks.outstanding < MAX_OUTSTANDING;

  if (running && returning) {
    world.mark("foreground");
  }

  activity.update(step.to);

  if (!owed) {
    return;
  }

  // The resume read has answered and the minimum interval has passed.
  await flush();
  world.clock.advance(MIN_INTERVAL);
  await flush();

  if (probe.calls.length === before && !api.state.get().checking) {
    flagViolation(
      rig,
      "resume.check-skipped-while-path-up",
      `the world held ${world.truth().path} at the resume`,
    );
  }
};

const applyLease = (rig: Rig, step: Extract<Step, { kind: "lease" }>) => {
  if (rig.disposed) {
    return;
  }

  if (step.to === "start" && rig.lease === null) {
    const lease = rig.reach.start();

    lease.ready.catch(() => {});
    rig.lease = lease;

    return;
  }

  if (step.to === "release" && rig.lease !== null) {
    rig.lease.release();
    rig.lease = null;
  }
};

const applyProbe = (rig: Rig, step: Extract<Step, { kind: "probe" }>) => {
  const { world, probe } = rig;
  const call = probe.calls.findIndex((candidate) => !candidate.settled());

  if (call === -1) {
    return;
  }

  world.mark("probe-done", `${call}:${step.verdict}`);

  if (step.verdict === "pass") {
    probe.pass();

    return;
  }

  probe.fail();
};

/** Does one step to the rig, as the world, the application or time would. */
export const applyStep = async (rig: Rig, step: Step) => {
  const { world, reach, api, activity } = rig;
  const { clock } = world;

  if (step.kind === "setup") {
    return;
  }

  if (step.kind === "change") {
    const heard = step.notify || (!STRICT && activity.get() !== "background");

    world.change(step.truth, { notify: heard });

    return;
  }

  if (step.kind === "activity") {
    await applyActivity(rig, step);

    return;
  }

  if (step.kind === "advance") {
    clock.advance(step.ms);

    return;
  }

  if (step.kind === "skip") {
    clock.skip(step.ms);
    clock.runDue();

    return;
  }

  if (step.kind === "wall") {
    clock.setNow(clock.now() + step.ms);

    return;
  }

  if (step.kind === "refresh") {
    world.hold(step.hold);
    reach.refresh().catch(() => {});

    return;
  }

  if (step.kind === "release") {
    world.release();

    return;
  }

  if (step.kind === "probe") {
    applyProbe(rig, step);

    return;
  }

  if (step.kind === "check") {
    api.check().catch(() => {});

    return;
  }

  if (step.kind === "lease") {
    applyLease(rig, step);

    return;
  }

  if (step.kind === "gap") {
    world.gap();

    return;
  }

  if (step.kind === "late") {
    world.lateEvent();

    return;
  }

  if (step.kind === "dispose") {
    reach.dispose();
    rig.disposed = true;
    rig.lease = null;

    return;
  }

  assertUnreachable(step);
};
