import { expect, test } from "vitest";

import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import { copyCapabilities } from "src/utils/internal/evidence/copyCapabilities";

test("published capabilities are a frozen copy the adapter cannot change later", () => {
  const bases: Array<"native-metering" | "custom"> = ["native-metering"];

  const declared: NetworkCapabilities = {
    ...MOCK_CAPABILITIES,
    "cost.metered": { support: "supported", notifications: "partial", bases },
    "cost.expensive": { support: "unsupported" },
  };

  const copy = copyCapabilities(declared);

  bases.push("custom");

  expect(copy).toEqual({
    ...MOCK_CAPABILITIES,
    "cost.metered": {
      support: "supported",
      notifications: "partial",
      bases: ["native-metering"],
    },
    "cost.expensive": { support: "unsupported" },
  });
  expect(Object.isFrozen(copy)).toBe(true);
  expect(Object.isFrozen(copy["cost.metered"])).toBe(true);
});
