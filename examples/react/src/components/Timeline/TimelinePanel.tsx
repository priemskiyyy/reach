import { Eraser, Waveform } from "@phosphor-icons/react";
import type React from "react";

import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import type { Timeline } from "example-shared/darkroom/runtime/types/Timeline";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";
import { TimelineRow } from "src/components/Timeline/TimelineRow";
import { useEventLog } from "src/hooks/useEventLog";
import { useObservable } from "src/hooks/useObservable";

type TimelinePanelProps = { timeline: Timeline; runtime: DarkroomRuntime };

export const TimelinePanel: React.FunctionComponent<TimelinePanelProps> = ({
  timeline,
  runtime,
}) => {
  const entries = useEventLog(timeline.log);
  const { counters } = useObservable(runtime.reach.diagnostics);

  return (
    <Panel
      title="Timeline"
      icon={Waveform}
      shows="Reach's own diagnostics: leases, sessions, observations and checks, newest first. They never carry an account or a value."
      aside={
        <button
          type="button"
          disabled={entries.length === 0}
          onClick={timeline.log.clear}
          className={buttonStyles({ size: "small" })}
        >
          <Eraser aria-hidden="true" size={14} weight="bold" />
          Clear
        </button>
      }
    >
      {entries.length === 0 ? (
        <EmptyState
          icon={Waveform}
          title="Nothing happened yet"
          description="Take a photo, check the API or open the lab to see the timeline fill in."
        />
      ) : (
        <ol
          aria-label="Timeline events"
          className="flex max-h-[28rem] flex-col divide-y divide-slate-200/70 overflow-y-auto dark:divide-slate-800"
        >
          {entries.map((entry) => (
            <TimelineRow key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
      <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-3 font-mono text-xs text-slate-500 dark:border-slate-800">
        <span>duplicates {counters.duplicateObservations}</span>
        <span>discarded {counters.discardedObservations}</span>
        <span>late callbacks {counters.lateCallbacks}</span>
        <span>skipped checks {counters.skippedChecks}</span>
      </p>
    </Panel>
  );
};
