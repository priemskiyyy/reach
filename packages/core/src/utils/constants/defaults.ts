import type { MonitorTrigger } from "src/types/MonitorTrigger";
import { freezeList } from "src/utils/internal/common/freezeList";

/** Milliseconds the adapter may take to open. */
export const DEFAULT_OPEN_TIMEOUT = 10_000;

/** Milliseconds one source refresh may take. */
export const DEFAULT_REFRESH_TIMEOUT = 10_000;

/** Milliseconds one endpoint check may take, including the application's own evaluation. */
export const DEFAULT_CHECK_TIMEOUT = 5_000;

/** Checks that may run physically at once, abandoned ones included. */
export const DEFAULT_MAX_OUTSTANDING_CHECKS = 4;

/** What starts a monitored check when the policy names no triggers. */
export const DEFAULT_MONITOR_TRIGGERS: MonitorTrigger[] = freezeList([
  "start",
  "network-change",
]);

/** Milliseconds between two automatic starts of one endpoint. */
export const DEFAULT_MIN_INTERVAL = 1_000;

/** Milliseconds the two clocks may disagree by before a result counts as interrupted. */
export const CLOCK_SKEW_TOLERANCE = 1_000;

/** The longest delay a host timer keeps; a longer wait is re-armed when this one fires. */
export const MAX_TIMER_DELAY = 2_147_483_647;
