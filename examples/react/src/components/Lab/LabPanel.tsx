import {
  CloudSlash,
  Flask,
  Leaf,
  Plugs,
  Timer,
  WarningCircle,
} from "@phosphor-icons/react";
import clsx from "clsx";
import type React from "react";

import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { DarkroomServices } from "example-shared/darkroom/runtime/types/DarkroomServices";
import { LATENCY_OPTIONS } from "example-shared/lab/constants/latencyOptions";
import { LINK_OPTIONS } from "example-shared/lab/constants/linkOptions";
import { CARD_CLASS_NAME } from "example-shared/ui/styles/cardStyles";
import { Badge } from "src/components/Badge/Badge";
import { LabControl } from "src/components/Lab/LabControl";
import { LabField } from "src/components/Lab/LabField";
import { SegmentedControl } from "src/components/SegmentedControl/SegmentedControl";
import { useObservable } from "src/hooks/useObservable";

type LabPanelProps = { services: DarkroomServices; source: NetworkSource };

export const LabPanel: React.FunctionComponent<LabPanelProps> = ({
  services: { phone, backend },
  source,
}) => {
  const device = useObservable(phone.state);
  const api = useObservable(backend.state);

  return (
    <section
      aria-label="Lab"
      className={clsx(
        "flex h-full min-w-0 flex-col gap-5 border-dashed p-5",
        CARD_CLASS_NAME,
      )}
    >
      <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-800 dark:text-slate-200">
        <Flask
          aria-hidden="true"
          size={18}
          weight="duotone"
          className="text-sky-600 dark:text-sky-400"
        />
        Lab
      </h3>
      {source === "browser" ? (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:bg-sky-950/40 dark:text-sky-100">
          Reach is reading this browser, so the phone's controls change nothing
          it sees. Switch the source back, or take your own network down.
        </p>
      ) : null}
      <LabField label="The phone's link">
        <SegmentedControl
          label="The phone's link"
          options={LINK_OPTIONS}
          value={device.link}
          onSelect={phone.setLink}
        />
        {device.joining ? <Badge tone="info">Joining</Badge> : null}
      </LabField>
      <ul className="grid gap-3 sm:grid-cols-2">
        <LabControl
          icon={Leaf}
          label="Low Data Mode"
          description="The user asks apps to save data. Automatic backup pauses for it; Back up now still uploads."
          pressed={device.lowDataMode}
          onPress={() => phone.setLowDataMode(!device.lowDataMode)}
        />
        <LabControl
          icon={Plugs}
          label="Network service fails"
          description="The phone's connectivity service stops answering. Every fact becomes an error, never offline."
          pressed={device.failing}
          onPress={() => phone.setFailing(!device.failing)}
        />
      </ul>
      <LabField label="Your API's latency">
        <SegmentedControl
          label="Your API's latency"
          options={LATENCY_OPTIONS}
          value={api.latency}
          onSelect={backend.setLatency}
        />
      </LabField>
      <ul className="grid gap-3 sm:grid-cols-2">
        <LabControl
          icon={CloudSlash}
          label="API offline"
          description="Every request answers 503. The API's check fails while the network facts stay exactly as they were."
          pressed={api.offline}
          onPress={() => backend.setOffline(!api.offline)}
        />
        <LabControl
          icon={WarningCircle}
          label="API degraded"
          description="Health answers degraded and uploads are refused. The check fails its test, with an answer received."
          pressed={api.degraded}
          onPress={() => backend.setDegraded(!api.degraded)}
        />
        <LabControl
          icon={Timer}
          label="Client ignores cancel"
          description="Your client keeps a request going after Reach gives up, as some native clients do. At 6 s each timed-out check stays detached, holding one of Reach's four slots until its answer arrives."
          pressed={api.ignoreAbort}
          onPress={() => backend.setIgnoreAbort(!api.ignoreAbort)}
        />
      </ul>
    </section>
  );
};
