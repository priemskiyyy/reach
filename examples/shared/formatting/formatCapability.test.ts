import { expect, test } from "vitest";

import { formatCapability } from "example-shared/formatting/formatCapability";
import { formatEvidence } from "example-shared/formatting/formatEvidence";

test("a capability names its bases and how many changes it reports", () => {
  expect(
    formatCapability({
      support: "supported",
      notifications: "complete",
      bases: ["native-path", "native-validation"],
    }),
  ).toBe(
    "Observed from Native path or Native validation, every change reported.",
  );
  expect(
    formatCapability({
      support: "supported",
      notifications: "partial",
      bases: ["browser-hint"],
    }),
  ).toBe("Observed from Browser hint, some changes may be missed.");
  expect(formatCapability({ support: "unsupported" })).toBe(
    "This source cannot observe it.",
  );
  expect(formatCapability(null)).toBe(
    "Not declared yet: the source has not opened.",
  );
});

test("evidence names its basis when current, and why not otherwise", () => {
  expect(
    formatEvidence(
      {
        status: "current",
        basis: "native-validation",
        receivedAt: Date.UTC(2026, 0, 1, 9, 30, 5),
        reason: null,
      },
      "internet.status",
    ),
  ).toMatch(/^Native validation, at \d{2}:\d{2}:05$/);
  expect(
    formatEvidence(
      {
        status: "unsupported",
        basis: "none",
        receivedAt: null,
        reason: "unsupported",
      },
      "cost.metered",
    ),
  ).toBe("this source cannot tell whether the connection is metered");
});
