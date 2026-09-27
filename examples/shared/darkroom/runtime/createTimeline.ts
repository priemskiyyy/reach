import type { ReachDiagnosticEvent } from "@priemskiyyy/reach";

import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { TimelineEntry } from "example-shared/darkroom/runtime/types/TimelineEntry";
import { createEventLog } from "example-shared/utils/createEventLog";

/** Every runtime's diagnostics events in one log, so a switch of source reads as one story. */
export const createTimeline = () => {
  const entries = createEventLog<TimelineEntry>(80);
  let nextId = 1;

  return {
    log: entries.log,
    record: (event: ReachDiagnosticEvent, source: NetworkSource) => {
      entries.add({ ...event, id: nextId, source });
      nextId += 1;
    },
  };
};
