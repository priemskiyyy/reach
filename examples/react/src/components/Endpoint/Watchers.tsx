import type React from "react";

import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { Watcher } from "src/components/Endpoint/Watcher";

type WatchersProps = { runtime: DarkroomRuntime; count: number };

export const Watchers: React.FunctionComponent<WatchersProps> = ({
  runtime,
  count,
}) => {
  if (count === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Add a watcher: each one reads the API's state with useEndpoint. Reading
        never checks, so no watcher sends a request or adds a monitor.
      </p>
    );
  }

  return (
    <ul aria-label="Watchers" className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Watcher key={index} runtime={runtime} number={index + 1} />
      ))}
    </ul>
  );
};
