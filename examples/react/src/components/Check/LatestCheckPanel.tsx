import { CircleNotch, Heartbeat } from "@phosphor-icons/react";
import { useEndpoint, useNetwork } from "@priemskiyyy/reach-react";
import type React from "react";

import {
  ENDPOINT_STATUS_LABELS,
  FRESHNESS_LABELS,
} from "example-shared/darkroom/network/constants/labels";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { formatEndpointSummary } from "example-shared/formatting/formatEndpointSummary";
import {
  ENDPOINT_STATUS_TONES,
  FRESHNESS_TONES,
} from "example-shared/ui/constants/tones";
import { Badge } from "src/components/Badge/Badge";
import { ObservationDetails } from "src/components/Check/ObservationDetails";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";
import { useNow } from "src/hooks/useNow";

type LatestCheckPanelProps = { runtime: DarkroomRuntime };

export const LatestCheckPanel: React.FunctionComponent<
  LatestCheckPanelProps
> = ({ runtime }) => {
  const state = useEndpoint(runtime.api);
  const generation = useNetwork(runtime.reach, (network) => network.generation);
  const now = useNow(1_000);

  return (
    <Panel
      title="Latest check"
      icon={Heartbeat}
      shows="What Reach knows about your API for the signed-in account: its last answer, and whether that answer still counts."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={ENDPOINT_STATUS_TONES[state.status]}>
          {ENDPOINT_STATUS_LABELS[state.status]}
        </Badge>
        <Badge tone={FRESHNESS_TONES[state.freshness]}>
          {FRESHNESS_LABELS[state.freshness]}
        </Badge>
        {state.checking ? (
          <Badge tone="info">
            <CircleNotch
              aria-hidden="true"
              size={12}
              weight="bold"
              className="animate-spin"
            />
            Checking
          </Badge>
        ) : null}
      </div>
      <p className="text-base leading-relaxed">
        {formatEndpointSummary(state, { generation, now })}
      </p>
      {state.lastObservation === null ? (
        <EmptyState
          icon={Heartbeat}
          title="No answer for this account"
          description="The API is checked for whoever is signed in, and one account never borrows another's answer."
        />
      ) : (
        <ObservationDetails observation={state.lastObservation} />
      )}
    </Panel>
  );
};
