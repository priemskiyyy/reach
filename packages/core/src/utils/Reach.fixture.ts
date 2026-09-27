import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { observed } from "src/mock/observed";
import type { MockNetworkOptions } from "src/mock/types/MockNetworkOptions";
import type { ObservationInput } from "src/mock/types/ObservationInput";
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
