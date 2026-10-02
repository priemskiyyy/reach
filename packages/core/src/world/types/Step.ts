import type { MonitorTrigger } from "src/types/MonitorTrigger";
import type { Truth } from "src/world/types/Truth";

/** One move of a script: the world, the application or time does something. */
export type Step =
  | { kind: "setup"; on: MonitorTrigger[] }
  | { kind: "change"; truth: Truth; notify: boolean }
  | { kind: "activity"; to: "foreground" | "background" }
  | { kind: "advance"; ms: number }
  | { kind: "skip"; ms: number }
  | { kind: "wall"; ms: number }
  | { kind: "refresh"; hold: boolean }
  | { kind: "release" }
  | { kind: "probe"; verdict: "pass" | "fail" }
  | { kind: "check" }
  | { kind: "lease"; to: "start" | "release" }
  | { kind: "gap" }
  | { kind: "late" }
  | { kind: "dispose" };
