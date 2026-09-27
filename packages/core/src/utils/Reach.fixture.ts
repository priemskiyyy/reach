import { createMockEndpoint } from "src/mock/createMockEndpoint";
import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { observed } from "src/mock/observed";
import type { MockNetworkOptions } from "src/mock/types/MockNetworkOptions";
import type { ObservationInput } from "src/mock/types/ObservationInput";
import type { Activity } from "src/types/Activity";
import type { EndpointDefinition } from "src/types/EndpointDefinition";
import { ValueStore } from "src/utils/internal/observable/ValueStore";
import { Reach } from "src/utils/Reach";

export const CONNECTED_WIFI: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("wifi", "native-path"),
  },
  internet: { status: observed("online", "native-validation") },
};

export const CONNECTED_CELLULAR: ObservationInput = {
  connection: {
    status: observed("connected", "native-path"),
    type: observed("cellular", "native-path"),
  },
  internet: { status: observed("online", "native-validation") },
};

// Lets every queued promise continuation run before the test goes on.
export const settle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

export const createReach = (options: MockNetworkOptions = {}) => {
  const mock = createMockNetwork(options);
  const clock = createTestClock({ now: 1_000 });
  const reach = new Reach({ adapter: mock.adapter, clock });

  return { reach, mock, clock };
};

type EndpointReachOptions = {
  endpoint?: Omit<EndpointDefinition, "check" | "staleAfter"> & {
    staleAfter?: number;
  };
  network?: MockNetworkOptions;
  activity?: Activity;
  maxOutstandingChecks?: number;
};

// A running-ready Reach with one mock endpoint named `api` and an activity source when asked.
export const createEndpointReach = ({
  endpoint = {},
  network = {},
  activity,
  maxOutstandingChecks,
}: EndpointReachOptions = {}) => {
  const mock = createMockNetwork({ initial: CONNECTED_WIFI, ...network });
  const probe = createMockEndpoint({ staleAfter: 30_000, ...endpoint });
  const clock = createTestClock({ now: 1_000 });
  const activityStore = new ValueStore<Activity>(activity ?? "unknown");

  const reach = new Reach({
    adapter: mock.adapter,
    clock,
    endpoints: { api: probe.definition },
    ...(activity === undefined ? {} : { activity: activityStore.observable }),
    ...(maxOutstandingChecks === undefined ? {} : { maxOutstandingChecks }),
  });

  return {
    reach,
    mock,
    probe,
    clock,
    api: reach.endpoint("api"),
    setActivity: activityStore.update,
  };
};
