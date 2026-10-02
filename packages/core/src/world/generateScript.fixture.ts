import type { MonitorTrigger } from "src/types/MonitorTrigger";
import { createRandom } from "src/world/createRandom.fixture";
import type { Step } from "src/world/types/Step";
import type { Truth } from "src/world/types/Truth";

const TRIGGERS: MonitorTrigger[][] = [
  ["start", "network-change", "foreground"],
  ["foreground"],
];

const PATHS: Array<Truth["path"]> = ["wifi", "cellular", "none"];
const REACHABLE = [true, false, null];
const ADVANCES = [100, 900, 1_000, 5_000, 14_000, 31_000];
const SKIPS = [2_000, 40_000];
const WALLS = [-20_000, 3_000, 60_000];

/** A script of `steps` moves that is a pure function of `seed`. */
export const generateScript = (seed: number, steps: number): Step[] => {
  const random = createRandom(seed);
  const int = (below: number) => Math.floor(random() * below);
  const chance = (share: number) => random() < share;

  const script: Step[] = [
    { kind: "setup", on: TRIGGERS[int(2)] ?? ["foreground"] },
    { kind: "lease", to: "start" },
  ];

  const pickTruth = (): Truth => ({
    path: PATHS[int(3)] ?? "wifi",
    reachable: REACHABLE[int(3)] ?? null,
    metered: chance(0.5),
  });

  for (let at = 0; at < steps; at += 1) {
    const roll = int(100);

    if (roll < 14) {
      script.push({ kind: "change", truth: pickTruth(), notify: chance(0.6) });
    } else if (roll < 24) {
      script.push({
        kind: "activity",
        to: chance(0.5) ? "foreground" : "background",
      });
    } else if (roll < 38) {
      script.push({ kind: "advance", ms: ADVANCES[int(6)] ?? 100 });
    } else if (roll < 42) {
      script.push({ kind: "skip", ms: SKIPS[int(2)] ?? 2_000 });
    } else if (roll < 45) {
      script.push({ kind: "wall", ms: WALLS[int(3)] ?? 3_000 });
    } else if (roll < 53) {
      script.push({ kind: "refresh", hold: chance(0.4) });
    } else if (roll < 59) {
      script.push({ kind: "release" });
    } else if (roll < 69) {
      script.push({ kind: "probe", verdict: chance(0.7) ? "pass" : "fail" });
    } else if (roll < 74) {
      script.push({ kind: "check" });
    } else if (roll < 80) {
      script.push({ kind: "lease", to: chance(0.5) ? "start" : "release" });
    } else if (roll < 82) {
      script.push({ kind: "gap" });
    } else if (roll < 84) {
      script.push({ kind: "late" });
    } else if (roll < 85) {
      script.push({ kind: "dispose" });
    } else {
      script.push({ kind: "advance", ms: 1_000 });
    }
  }

  return script;
};
