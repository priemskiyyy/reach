import type { RuntimeStatus } from "src/types/RuntimeStatus";

/** No lease holds the runtime. */
export const IDLE_STATUS: RuntimeStatus = Object.freeze({ state: "idle" });

/** The adapter is opening. */
export const STARTING_STATUS: RuntimeStatus = Object.freeze({
  state: "starting",
});

/** The source is adopted and no refresh runs. */
export const RUNNING_STATUS: RuntimeStatus = Object.freeze({
  state: "running",
  refreshing: false,
});

/** The source is adopted and a refresh runs. */
export const REFRESHING_STATUS: RuntimeStatus = Object.freeze({
  state: "running",
  refreshing: true,
});

/** Terminal. */
export const DISPOSED_STATUS: RuntimeStatus = Object.freeze({
  state: "disposed",
});
