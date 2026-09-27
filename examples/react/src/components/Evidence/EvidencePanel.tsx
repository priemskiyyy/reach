import { ArrowClockwise, Fingerprint } from "@phosphor-icons/react";
import { useNetwork } from "@priemskiyyy/reach-react";
import type React from "react";

import {
  FIELD_ORDER,
  REFRESH_LABELS,
  SOURCE_LABELS,
  SOURCE_MEANINGS,
} from "example-shared/darkroom/network/constants/labels";
import type { RefreshOutcome } from "example-shared/darkroom/network/types/RefreshOutcome";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { REFRESH_TONES } from "example-shared/ui/constants/tones";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { Badge } from "src/components/Badge/Badge";
import { EvidenceLegend } from "src/components/Evidence/EvidenceLegend";
import { EvidenceRow } from "src/components/Evidence/EvidenceRow";
import { Panel } from "src/components/Panel/Panel";
import { useObservable } from "src/hooks/useObservable";
import { SOURCE_ICONS } from "src/utils/constants/icons";

type EvidencePanelProps = {
  runtime: DarkroomRuntime;
  refresh: RefreshOutcome | null;
  onRefreshPress: () => void;
};

export const EvidencePanel: React.FunctionComponent<EvidencePanelProps> = ({
  runtime,
  refresh,
  onRefreshPress,
}) => {
  // The network in context, from the ReachProvider around the page.
  const state = useNetwork();
  const capabilities = useObservable(runtime.reach.capabilities);

  return (
    <Panel
      title={`Facts from ${SOURCE_LABELS[runtime.source]}`}
      icon={SOURCE_ICONS[runtime.source]}
      shows={SOURCE_MEANINGS[runtime.source]}
      aside={
        <>
          {refresh === null ? null : (
            <Badge tone={REFRESH_TONES[refresh.status]}>
              {REFRESH_LABELS[refresh.status]}
            </Badge>
          )}
          <button
            type="button"
            onClick={onRefreshPress}
            className={buttonStyles({ size: "small" })}
          >
            <ArrowClockwise aria-hidden="true" size={14} weight="bold" />
            Read again
          </button>
        </>
      }
    >
      <ul aria-label="Facts" className="grid gap-2 sm:grid-cols-2">
        {FIELD_ORDER.map((field) => (
          <EvidenceRow
            key={field}
            field={field}
            state={state}
            capability={capabilities === null ? null : capabilities[field]}
          />
        ))}
      </ul>
      <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Fingerprint
          aria-hidden="true"
          size={18}
          weight="duotone"
          className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400"
        />
        Generation {state.generation} · revision {state.revision}. A new
        generation starts with every change of connection or gap in reporting,
        and every check of the API from an older one stops counting.
      </p>
      <EvidenceLegend />
    </Panel>
  );
};
