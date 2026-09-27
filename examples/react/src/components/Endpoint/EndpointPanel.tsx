import { Eraser, Heartbeat, UsersThree } from "@phosphor-icons/react";
import { useEndpoint } from "@priemskiyyy/reach-react";
import type React from "react";

import {
  API_INTERVAL,
  API_STALE_AFTER,
  API_TIMEOUT,
} from "example-shared/darkroom/network/constants/endpoint";
import type { CheckRequest } from "example-shared/darkroom/network/types/CheckRequest";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { formatCheckRequest } from "example-shared/formatting/formatCheckRequest";
import { formatSeconds } from "example-shared/formatting/formatSeconds";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { FreshnessMeter } from "src/components/Endpoint/FreshnessMeter";
import { Panel } from "src/components/Panel/Panel";
import { useNow } from "src/hooks/useNow";
import { useObservable } from "src/hooks/useObservable";

type EndpointPanelProps = {
  runtime: DarkroomRuntime;
  request: CheckRequest | null;
  onCheckPress: (callers: number) => void;
  onInvalidatePress: () => void;
};

export const EndpointPanel: React.FunctionComponent<EndpointPanelProps> = ({
  runtime,
  request,
  onCheckPress,
  onInvalidatePress,
}) => {
  const state = useEndpoint(runtime.api);
  const { endpoints } = useObservable(runtime.reach.diagnostics);
  const now = useNow(1_000);
  const [api] = endpoints;

  const rows = [
    { label: "Monitors", value: `${api?.monitors ?? 0}` },
    { label: "Callers waiting", value: `${api?.waiters ?? 0}` },
    { label: "Counts for", value: formatSeconds(API_STALE_AFTER) },
    { label: "Times out after", value: formatSeconds(API_TIMEOUT) },
    {
      label: "While monitored",
      value: `Every ${formatSeconds(API_INTERVAL)} in the foreground`,
    },
    {
      label: "Checks again on",
      value: "Start, a network change, a new account, the foreground",
    },
  ];

  return (
    <Panel
      title="The API endpoint"
      icon={Heartbeat}
      shows="One named endpoint, checked through your own client. Callers who ask while a check runs join it, and nothing is checked unless something asks."
    >
      <FreshnessMeter state={state} now={now} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCheckPress(1)}
          className={buttonStyles({ variant: "primary" })}
        >
          <Heartbeat aria-hidden="true" size={16} weight="bold" />
          Check now
        </button>
        <button
          type="button"
          onClick={() => onCheckPress(2)}
          className={buttonStyles()}
        >
          <UsersThree aria-hidden="true" size={16} weight="bold" />
          Check twice at once
        </button>
        <button
          type="button"
          onClick={onInvalidatePress}
          className={buttonStyles({ variant: "ghost" })}
        >
          <Eraser aria-hidden="true" size={16} weight="bold" />
          Invalidate
        </button>
      </div>
      <p
        role="status"
        aria-label="Check result"
        className="text-base leading-relaxed"
      >
        {request === null
          ? "Ask for a check, or for two at once and watch the network log."
          : formatCheckRequest(request)}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-slate-100/70 p-4 text-sm sm:grid-cols-3 dark:bg-slate-800/40">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col">
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              {label}
            </dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
};
