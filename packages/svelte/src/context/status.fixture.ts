import { Reach } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";

// A connected, online Reach, and the props its status view reads.
export const createStatus = () => {
  const mock = createMockNetwork({
    initial: {
      connection: { status: observed("connected", "native-path") },
      internet: { status: observed("online", "native-validation") },
    },
  });

  const probe = createMockEndpoint({ staleAfter: 30_000 });

  const network = new Reach({
    adapter: mock.adapter,
    clock: createTestClock({ now: 1_000 }),
    endpoints: { api: probe.definition },
  });

  const props = {
    network,
    online: network.condition({ internet: "online" }),
    api: network.endpoint("api"),
  };

  return { mock, probe, network, props };
};
