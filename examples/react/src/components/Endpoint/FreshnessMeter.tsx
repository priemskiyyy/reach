import type { EndpointState } from "@priemskiyyy/reach";
import type React from "react";

import { API_STALE_AFTER } from "example-shared/darkroom/network/constants/endpoint";
import { FRESHNESS_LABELS } from "example-shared/darkroom/network/constants/labels";
import { formatSeconds } from "example-shared/formatting/formatSeconds";
import { meterStyles } from "example-shared/ui/styles/meterStyles";

type FreshnessMeterProps = { state: EndpointState; now: number };

// One cell for each second an answer counts.
const CELLS = Array.from(
  { length: API_STALE_AFTER / 1_000 },
  (_, index) => index,
);

const readRemaining = (
  { freshness, lastObservation }: EndpointState,
  now: number,
) => {
  if (freshness !== "fresh" || lastObservation === null) {
    return 0;
  }

  return Math.max(0, lastObservation.completedAt + API_STALE_AFTER - now);
};

/** How long the last answer still counts, second by second. */
export const FreshnessMeter: React.FunctionComponent<FreshnessMeterProps> = ({
  state,
  now,
}) => {
  const remaining = readRemaining(state, now);
  const seconds = Math.ceil(remaining / 1_000);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">Freshness</span>
        <span className="text-slate-500 dark:text-slate-400">
          {state.freshness === "fresh"
            ? `Counts for ${formatSeconds(remaining)} more`
            : FRESHNESS_LABELS[state.freshness]}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Freshness"
        aria-valuemin={0}
        aria-valuemax={CELLS.length}
        aria-valuenow={seconds}
        className="flex gap-0.5"
      >
        {CELLS.map((cell) => (
          <span
            key={cell}
            className={meterStyles({ filled: cell < seconds })}
          />
        ))}
      </div>
    </div>
  );
};
