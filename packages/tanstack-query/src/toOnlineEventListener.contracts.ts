// Typechecked, never run: the listener installs into Query's real online
// manager, which the bridge itself never imports.
import { Reach } from "@priemskiyyy/reach";
import { createMockNetwork } from "@priemskiyyy/reach/mock";
import { onlineManager } from "@tanstack/query-core";

import { toOnlineEventListener } from "src/toOnlineEventListener";

const network = new Reach({ adapter: createMockNetwork().adapter });
const internet = network.condition({ internet: "online" });

onlineManager.setEventListener(toOnlineEventListener(internet));

onlineManager.setEventListener(
  toOnlineEventListener(internet, { unknown: "preserve" }),
);

// @ts-expect-error Unknown is online, offline or preserved; nothing is guessed.
toOnlineEventListener(internet, { unknown: "verified" });

// @ts-expect-error The bridge reads a condition, never the whole state.
toOnlineEventListener(network.state);
