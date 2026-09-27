import { expect, test } from "vitest";

import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { observed } from "src/mock/observed";
import { NETWORK_FIELDS } from "src/utils/constants/network";
import { Reach } from "src/utils/Reach";

test("a mock report on any basis rests on one the mock declares", async () => {
  const mock = createMockNetwork();
  const reach = new Reach({ adapter: mock.adapter, clock: createTestClock() });

  await reach.start().ready;
  mock.emit({
    connection: {
      status: observed("connected", "native-path"),
      type: observed("cellular", "provider-report"),
      transports: observed(["cellular"], "browser-hint"),
    },
    internet: { status: observed("online", "native-validation") },
    cost: {
      metered: observed(true, "native-metering"),
      expensive: observed(true, "native-expense"),
    },
    preferences: {
      constrained: observed(false, "user-data-preference"),
      saveData: observed(false),
    },
  });

  const { evidence } = reach.state.get();
  const capabilities = reach.capabilities.get();

  for (const field of NETWORK_FIELDS) {
    const fact = evidence[field];
    const capability = capabilities?.[field];

    expect(fact.status).toBe("current");
    expect(capability).toMatchObject({
      support: "supported",
      bases: expect.arrayContaining([fact.basis]),
    });
  }
});
