import type { Truth } from "src/world/types/Truth";

/** What the world says Reach was told last, and so must hold. */
export type Expected =
  { kind: "none" } | { kind: "stale" } | { kind: "truth"; truth: Truth };
