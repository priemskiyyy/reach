import type { createWorld } from "src/world/createWorld.fixture";

/** A fake operating system, as `createWorld` builds it. */
export type World = ReturnType<typeof createWorld>;
