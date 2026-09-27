import clsx from "clsx";
import type React from "react";

import { SOURCE_OPTIONS } from "example-shared/darkroom/network/constants/sourceOptions";
import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import type { DarkroomServices } from "example-shared/darkroom/runtime/types/DarkroomServices";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import { formatAccount } from "example-shared/formatting/formatAccount";
import { CARD_CLASS_NAME } from "example-shared/ui/styles/cardStyles";
import { AccountSwitcher } from "src/components/Darkroom/AccountSwitcher";
import { AutomaticStrip } from "src/components/Darkroom/AutomaticStrip";
import { BackupBar } from "src/components/Darkroom/BackupBar";
import { PhotoGrid } from "src/components/Darkroom/PhotoGrid";
import { StatusBar } from "src/components/Darkroom/StatusBar";
import { SegmentedControl } from "src/components/SegmentedControl/SegmentedControl";
import { useObservable } from "src/hooks/useObservable";

type DarkroomAppProps = {
  services: DarkroomServices;
  runtime: DarkroomRuntime;
  onAccountSelect: (account: AccountId | null) => void;
  onSourceSelect: (source: NetworkSource) => void;
  onAutomaticPress: () => void;
  onTakePress: () => void;
  onBackUpPress: () => void;
};

export const DarkroomApp: React.FunctionComponent<DarkroomAppProps> = ({
  services,
  runtime,
  onAccountSelect,
  onSourceSelect,
  onAutomaticPress,
  onTakePress,
  onBackUpPress,
}) => {
  const account = useObservable(services.account);
  const automatic = useObservable(services.automatic);
  const photos = useObservable(services.roll.photos);

  return (
    <section
      aria-label="Darkroom"
      className={clsx("min-w-0 overflow-hidden", CARD_CLASS_NAME)}
    >
      <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">
            {formatAccount(account)}
          </span>
          <div className="ml-auto">
            <AccountSwitcher
              account={account}
              onAccountSelect={onAccountSelect}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Reading the network from
          </span>
          <SegmentedControl
            label="Network source"
            options={SOURCE_OPTIONS}
            value={runtime.source}
            onSelect={onSourceSelect}
          />
        </div>
      </header>
      <AutomaticStrip
        runtime={runtime}
        enabled={automatic}
        onAutomaticPress={onAutomaticPress}
      />
      <div className="p-4">
        <PhotoGrid photos={photos} />
      </div>
      <BackupBar
        runtime={runtime}
        photos={photos}
        onTakePress={onTakePress}
        onBackUpPress={onBackUpPress}
      />
      <StatusBar runtime={runtime} />
    </section>
  );
};
