import type { Truth } from "src/world/types/Truth";

export const STALE_AFTER = 30_000;
export const CHECK_TIMEOUT = 5_000;
export const MIN_INTERVAL = 1_000;
export const INTERVAL = 15_000;
export const MAX_OUTSTANDING = 4;

/** Where every script starts: a path with confirmed reachability. */
export const INITIAL: Truth = { path: "wifi", reachable: true, metered: false };
