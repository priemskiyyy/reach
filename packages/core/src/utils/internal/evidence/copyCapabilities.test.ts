import { expect, test } from "vitest";

import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import { copyCapabilities } from "src/utils/internal/evidence/copyCapabilities";

test("published capabilities are a frozen copy the adapter cannot change later", () => {
  const declared: NetworkCapabilities = {
    ...MOCK_CAPABILITIES,
    fields: {
      ...MOCK_CAPABILITIES.fields,
      "cost.metered": {
        support: "supported",
        notifications: "partial",
        bases: ["native-metering"],
      },
    },
  };

  const copy = copyCapabilities(declared);

  declared.fields["cost.metered"].bases.push("custom");

  expect(copy).toEqual({
    ...MOCK_CAPABILITIES,
    fields: {
      ...MOCK_CAPABILITIES.fields,
      "cost.metered": {
        support: "supported",
        notifications: "partial",
        bases: ["native-metering"],
      },
    },
  });
  expect(Object.isFrozen(copy.fields["cost.metered"].bases)).toBe(true);
});
