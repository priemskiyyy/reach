import { NETWORK_FIELDS } from "src/utils/constants/network";
import { flagViolation } from "src/world/flagViolation.fixture";
import { READ_FIELD } from "src/world/readField.fixture";
import type { Expected } from "src/world/types/Expected";
import type { Rig } from "src/world/types/Rig";
import { WORLD_FIELDS } from "src/world/worldFields.fixture";

/** Every fact is current only when the world said it, and a fact that is not current reads unknown. */
export const checkFacts = (
  rig: Rig,
  expected: Expected,
  accepted: Set<number>,
) => {
  const state = rig.reach.state.get();

  for (const field of NETWORK_FIELDS) {
    const evidence = state.evidence[field];
    const value = READ_FIELD[field](state);

    if (
      evidence.status !== "current" &&
      value !== "unknown" &&
      value !== null
    ) {
      flagViolation(
        rig,
        "value.not-unknown",
        `${field} is ${String(value)} as ${evidence.status}`,
      );
    }

    if (evidence.status === "current" && !accepted.has(evidence.receivedAt)) {
      flagViolation(
        rig,
        "evidence.receivedAt-not-from-world",
        `${field} at ${evidence.receivedAt}`,
      );
    }
  }

  for (const { field, read } of WORLD_FIELDS) {
    const evidence = state.evidence[field];
    const value = READ_FIELD[field](state);

    if (expected.kind !== "truth") {
      if (evidence.status === "current") {
        flagViolation(
          rig,
          "state.current-without-a-report",
          `${field}, world says ${expected.kind}`,
        );
      }

      continue;
    }

    const said = read(expected.truth);

    if (said.status !== "current") {
      if (evidence.status === "current") {
        flagViolation(
          rig,
          "state.current-from-ambiguous",
          `${field} is ${String(value)}, world said ${said.status}`,
        );
      }

      continue;
    }

    if (evidence.status === "error") {
      flagViolation(
        rig,
        "state.error-without-world-error",
        `${field}: the world reported ${String(said.value)}`,
      );

      continue;
    }

    if (
      evidence.status !== "current" ||
      value !== said.value ||
      evidence.basis !== said.basis
    ) {
      flagViolation(
        rig,
        "state.differs-from-world",
        `${field} is ${String(value)} (${evidence.status}), world said ${String(said.value)}`,
      );
    }
  }
};
