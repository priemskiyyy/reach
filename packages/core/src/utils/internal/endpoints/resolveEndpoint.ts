import type { EndpointDefinition } from "src/types/EndpointDefinition";
import type { ResolvedEndpoint } from "src/types/internal/ResolvedEndpoint";
import type { MonitoringPolicy } from "src/types/MonitoringPolicy";
import {
  DEFAULT_CHECK_TIMEOUT,
  DEFAULT_MIN_INTERVAL,
  DEFAULT_MONITOR_TRIGGERS,
} from "src/utils/constants/defaults";
import { freezeList } from "src/utils/internal/common/freezeList";
import { resolveDuration } from "src/utils/internal/options/resolveDuration";
import { ReachError } from "src/utils/ReachError";

const createInvalid = (message: string) =>
  new ReachError({ code: "INVALID_CONFIGURATION", message });

const resolveInterval = (
  name: string,
  interval: MonitoringPolicy["interval"],
) => {
  if (interval === undefined) {
    return null;
  }

  if (interval === false) {
    return null;
  }

  return resolveDuration(name, interval);
};

// An interval pauses in the background only when something says it is.
const assertIntervalCanPause = (
  name: string,
  interval: number | null,
  { allowWithoutActivity }: MonitoringPolicy,
  hasActivity: boolean,
) => {
  if (interval === null) {
    return;
  }

  if (hasActivity) {
    return;
  }

  if (allowWithoutActivity === true) {
    return;
  }

  throw createInvalid(
    `${name} needs an activity source to pause in the background, or allowWithoutActivity.`,
  );
};

const resolveJitter = (name: string, jitter: number | undefined) => {
  const ratio = jitter ?? 0;

  // The type allows NaN, the infinities and numbers outside the share.
  if (!Number.isFinite(ratio)) {
    throw createInvalid(`${name} must be a number from 0 to 1.`);
  }

  if (ratio < 0) {
    throw createInvalid(`${name} must be a number from 0 to 1.`);
  }

  if (ratio > 1) {
    throw createInvalid(`${name} must be a number from 0 to 1.`);
  }

  return ratio;
};

/**
 * A definition with its defaults, checked once when the Reach is created:
 * durations a timer can keep, and monitoring that its activity source can
 * honor.
 */
export const resolveEndpoint = (
  name: string,
  { check, staleAfter, timeout, scope, monitoring = {} }: EndpointDefinition,
  hasActivity: boolean,
): ResolvedEndpoint => {
  const prefix = `endpoints.${name}`;
  const on = freezeList([...(monitoring.on ?? DEFAULT_MONITOR_TRIGGERS)]);

  if (on.includes("foreground") && !hasActivity) {
    throw createInvalid(
      `${prefix}.monitoring.on has "foreground", which needs an activity source.`,
    );
  }

  const interval = resolveInterval(
    `${prefix}.monitoring.interval`,
    monitoring.interval,
  );

  assertIntervalCanPause(
    `${prefix}.monitoring.interval`,
    interval,
    monitoring,
    hasActivity,
  );

  return Object.freeze({
    name,
    check,
    staleAfter: resolveDuration(`${prefix}.staleAfter`, staleAfter),
    timeout: resolveDuration(
      `${prefix}.timeout`,
      timeout,
      DEFAULT_CHECK_TIMEOUT,
    ),
    scope: scope ?? null,
    monitoring: Object.freeze({
      on,
      interval,
      minInterval: resolveDuration(
        `${prefix}.monitoring.minInterval`,
        monitoring.minInterval,
        DEFAULT_MIN_INTERVAL,
      ),
      whenOffline: monitoring.whenOffline ?? "skip",
      jitter: resolveJitter(`${prefix}.monitoring.jitter`, monitoring.jitter),
    }),
  });
};
