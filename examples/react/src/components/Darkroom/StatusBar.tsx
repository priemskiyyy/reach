import type React from "react";

import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { useObservable } from "src/hooks/useObservable";

type StatusBarProps = { runtime: DarkroomRuntime };

/** What Reach's diagnostics say about this session, which never carry an account. */
export const StatusBar: React.FunctionComponent<StatusBarProps> = ({
  runtime,
}) => {
  const snapshot = useObservable(runtime.reach.diagnostics);

  const monitors = snapshot.endpoints.reduce(
    (sum, endpoint) => sum + endpoint.monitors,
    0,
  );

  return (
    <footer
      aria-label="Reach session"
      className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 px-4 py-2 font-mono text-xs text-slate-500 dark:border-slate-800"
    >
      <span className="font-semibold text-slate-600 dark:text-slate-300">
        {snapshot.adapter}
      </span>
      <span>session #{snapshot.session ?? "none"}</span>
      <span>generation {snapshot.networkGeneration}</span>
      <span>leases {snapshot.leases}</span>
      <span>monitors {monitors}</span>
      <span>checks {snapshot.checks.outstanding}</span>
    </footer>
  );
};
