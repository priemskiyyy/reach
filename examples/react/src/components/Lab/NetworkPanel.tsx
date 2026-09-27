import { Eraser, Terminal } from "@phosphor-icons/react";
import type React from "react";

import { REQUEST_LABELS } from "example-shared/backend/constants/labels";
import type { PhotosBackend } from "example-shared/backend/types/PhotosBackend";
import { formatDuration } from "example-shared/formatting/formatDuration";
import { REQUEST_TONES } from "example-shared/ui/constants/tones";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { Badge } from "src/components/Badge/Badge";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";
import { useEventLog } from "src/hooks/useEventLog";

type NetworkPanelProps = { backend: PhotosBackend };

export const NetworkPanel: React.FunctionComponent<NetworkPanelProps> = ({
  backend,
}) => {
  const requests = useEventLog(backend.requests);

  return (
    <Panel
      title="Network"
      icon={Terminal}
      shows="What your API received: every health check and every upload, newest first."
      aside={
        <button
          type="button"
          disabled={requests.length === 0}
          onClick={backend.requests.clear}
          className={buttonStyles({ size: "small" })}
        >
          <Eraser aria-hidden="true" size={14} weight="bold" />
          Clear
        </button>
      }
    >
      {requests.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title="No requests yet"
          description="Check the API or take a photo to send one."
        />
      ) : (
        <ol
          aria-label="Requests"
          className="flex max-h-[28rem] flex-col divide-y divide-slate-200/70 overflow-y-auto text-sm dark:divide-slate-800"
        >
          {requests.map((request) => (
            <li
              key={request.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2.5"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-mono">
                  <span className="font-semibold">{request.method}</span>{" "}
                  {request.path}
                </span>
                <span className="truncate font-mono text-xs text-slate-500">
                  account {request.account ?? "none"}
                </span>
              </span>
              <Badge tone={REQUEST_TONES[request.outcome]}>
                {REQUEST_LABELS[request.outcome]}
              </Badge>
              <span className="w-16 text-right font-mono text-slate-500 tabular-nums">
                {formatDuration(request.duration)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
};
