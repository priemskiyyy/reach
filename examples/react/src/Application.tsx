import { ReachProvider } from "@priemskiyyy/reach-react";
import type React from "react";
import { useState } from "react";

import { refreshNetwork } from "example-shared/darkroom/network/refreshNetwork";
import { requestChecks } from "example-shared/darkroom/network/requestChecks";
import type { CheckRequest } from "example-shared/darkroom/network/types/CheckRequest";
import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { RefreshOutcome } from "example-shared/darkroom/network/types/RefreshOutcome";
import { createDarkroomRuntime } from "example-shared/darkroom/runtime/createDarkroomRuntime";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import type { DarkroomServices } from "example-shared/darkroom/runtime/types/DarkroomServices";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import { LatestCheckPanel } from "src/components/Check/LatestCheckPanel";
import { ConditionsPanel } from "src/components/Conditions/ConditionsPanel";
import { DecisionsPanel } from "src/components/Conditions/DecisionsPanel";
import { DarkroomApp } from "src/components/Darkroom/DarkroomApp";
import { EndpointPanel } from "src/components/Endpoint/EndpointPanel";
import { EvidencePanel } from "src/components/Evidence/EvidencePanel";
import { Footer } from "src/components/Footer/Footer";
import { Header } from "src/components/Header/Header";
import { Hero } from "src/components/Hero/Hero";
import { LabPanel } from "src/components/Lab/LabPanel";
import { NetworkPanel } from "src/components/Lab/NetworkPanel";
import { Section } from "src/components/Section/Section";
import { TimelinePanel } from "src/components/Timeline/TimelinePanel";

type ApplicationProps = {
  services: DarkroomServices;
  runtime: DarkroomRuntime;
};

export const Application: React.FunctionComponent<ApplicationProps> = ({
  services,
  runtime: initialRuntime,
}) => {
  const [runtime, setRuntime] = useState(initialRuntime);
  const [refresh, setRefresh] = useState<RefreshOutcome | null>(null);
  const [request, setRequest] = useState<CheckRequest | null>(null);
  const [watchers, setWatchers] = useState(0);

  const handleAccountSelect = (account: AccountId | null) => {
    services.account.set(account);
  };

  // A disposed Reach cannot start again, so a switch of source replaces the
  // runtime; the account, the roll and the timeline carry over.
  const handleSourceSelect = (source: NetworkSource) => {
    if (source === runtime.source) {
      return;
    }

    runtime.dispose();
    setRuntime(createDarkroomRuntime({ ...services, source }));
    setRefresh(null);
    setRequest(null);
  };

  const handleAutomaticPress = () => {
    services.automatic.set(!services.automatic.get());
  };

  const handleTakePress = () => {
    services.roll.take();
  };

  const handleBackUpPress = async () => {
    await runtime.backUpNow();
  };

  const handleRefreshPress = async () => {
    setRefresh(await refreshNetwork(runtime.reach));
  };

  const handleCheckPress = async (callers: number) => {
    setRequest({ state: "running", callers });
    setRequest(await requestChecks(runtime.api, callers));
  };

  const handleInvalidatePress = () => {
    runtime.api.invalidate();
  };

  const handleWatchPress = () => {
    setWatchers(watchers + 1);
  };

  const handleUnwatchPress = () => {
    setWatchers(0);
  };

  return (
    <ReachProvider network={runtime.reach}>
      <Header runtime={runtime} />
      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6">
        <Hero />
        <Section
          id="app"
          hint="Take a photo: it backs up on its own. Then switch the phone to cellular in the lab and take another. Automatic backup pauses and says why, and Back up now still sends it."
        >
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <DarkroomApp
              services={services}
              runtime={runtime}
              onAccountSelect={handleAccountSelect}
              onSourceSelect={handleSourceSelect}
              onAutomaticPress={handleAutomaticPress}
              onTakePress={handleTakePress}
              onBackUpPress={handleBackUpPress}
            />
            <LatestCheckPanel runtime={runtime} />
          </div>
        </Section>
        <Section
          id="evidence"
          hint="Switch the source to This browser. Internet turns unsupported, because a browser only hints at a connection, and metering cannot be told at all, so automatic backup waits instead of guessing."
        >
          <EvidencePanel
            runtime={runtime}
            refresh={refresh}
            onRefreshPress={handleRefreshPress}
          />
        </Section>
        <Section
          id="conditions"
          hint="Join the hotel Wi-Fi in the lab. Online turns unknown, not offline: the phone cannot tell behind a sign-in page. The API's check fails there, so both features refuse, each for its own reason."
        >
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <ConditionsPanel runtime={runtime} />
            <DecisionsPanel runtime={runtime} />
          </div>
        </Section>
        <Section
          id="endpoint"
          hint="Press Check twice at once: two callers, one request in the network log. Then press Invalidate and Back up now: the API is unknown, so Darkroom tries and lets the upload answer."
        >
          <EndpointPanel
            runtime={runtime}
            request={request}
            watchers={watchers}
            onCheckPress={handleCheckPress}
            onInvalidatePress={handleInvalidatePress}
            onWatchPress={handleWatchPress}
            onUnwatchPress={handleUnwatchPress}
          />
        </Section>
        <Section
          id="lab"
          hint="Take your API offline and take a photo. The upload fails, Darkroom drops the API's answer and checks again, and automatic backup pauses instead of retrying in a loop. Then set 6 s, turn on Client ignores cancel and check: Reach gives up at 3 s, but the request runs on, detached, and its late answer changes nothing."
        >
          <div className="grid gap-3 xl:grid-cols-2">
            <LabPanel services={services} source={runtime.source} />
            <NetworkPanel backend={services.backend} />
          </div>
        </Section>
        <Section
          id="timeline"
          hint="Sign out and back in. The API is checked again for the new account, and the timeline shows the check without ever naming whose it was."
        >
          <TimelinePanel timeline={services.timeline} runtime={runtime} />
        </Section>
      </main>
      <Footer />
    </ReachProvider>
  );
};
