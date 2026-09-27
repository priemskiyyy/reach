import { ReachProvider } from "@priemskiyyy/reach-react";
import { registerRootComponent } from "expo";

import { Application } from "src/Application";
import { api, reach } from "src/network/reach";

// The app holds one lease and one monitor for as long as it lives. A failed
// opening shows in the runtime's status, which the header reads.
reach.start().ready.catch(() => {});
api.monitor();

const Root = () => (
  <ReachProvider network={reach}>
    <Application />
  </ReachProvider>
);

registerRootComponent(Root);
