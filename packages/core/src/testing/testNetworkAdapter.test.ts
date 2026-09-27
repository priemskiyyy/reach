import { expect, test, vi } from "vitest";

import { createObservation } from "src/mock/createObservation";
import { observed } from "src/mock/observed";
import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import { testNetworkAdapter } from "src/testing/testNetworkAdapter";
import type { NetworkAdapterHarness } from "src/testing/types/NetworkAdapterHarness";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";

// A host that toggles between Wi-Fi and cellular and counts its listeners.
const createHarness = ({
  available = true,
  capabilities = MOCK_CAPABILITIES,
  keepListener = false,
  refreshReports = true,
  cleanupThrows = false,
}: {
  available?: boolean;
  capabilities?: NetworkCapabilities;
  keepListener?: boolean;
  refreshReports?: boolean;
  cleanupThrows?: boolean;
} = {}): NetworkAdapterHarness => {
  const listeners = new Set<() => void>();
  const host: { type: "wifi" | "cellular" } = { type: "wifi" };

  const report = () =>
    createObservation({
      connection: {
        status: observed("connected"),
        type: observed(host.type),
      },
      cost: { metered: observed(host.type === "cellular") },
    });

  return {
    adapter: {
      name: "host",
      available: () => available,
      open: (context) => {
        const listener = () => context.emit(report());

        listeners.add(listener);

        if (!keepListener) {
          context.onDispose(() => listeners.delete(listener));
        }

        if (cleanupThrows) {
          context.onDispose(() => {
            throw new Error("cleanup");
          });
        }

        context.emit(report());

        return {
          native: host,
          capabilities,
          refresh: ({ emit }) => {
            if (refreshReports) {
              emit(report());
            }
          },
        };
      },
    },
    change: () => {
      host.type = host.type === "wifi" ? "cellular" : "wifi";

      for (const listener of [...listeners]) {
        listener();
      }
    },
    settle: () => Promise.resolve(),
    subscriptionCount: () => listeners.size,
  };
};

test("a well-behaved adapter passes every check", async () => {
  const { passed } = await testNetworkAdapter(() => createHarness());

  expect(passed).toEqual([
    "creating and probing the adapter subscribes to nothing",
    "opening declares a capability for every fact",
    "every report is complete and within the declared capabilities",
    "a change of the host is reported",
    "releasing removes every subscription and nothing reports afterwards",
    "a second session after a release observes again",
    "a refresh settles and reports within its capabilities",
  ]);
});

test("an adapter unavailable on the host under test fails", async () => {
  await expect(
    testNetworkAdapter(() => createHarness({ available: false })),
  ).rejects.toThrow(
    "Network adapter conformance: creating and probing the adapter subscribes to nothing.",
  );
});

test("an adapter that reports a fact it declared unsupported fails", async () => {
  const capabilities: NetworkCapabilities = {
    ...MOCK_CAPABILITIES,
    "cost.metered": { support: "unsupported" },
  };

  await expect(
    testNetworkAdapter(() => createHarness({ capabilities })),
  ).rejects.toThrow(
    "Network adapter conformance: every report is complete and within the declared capabilities.",
  );
});

test("an adapter that keeps its listener after release fails", async () => {
  await expect(
    testNetworkAdapter(() => createHarness({ keepListener: true })),
  ).rejects.toThrow(
    "Network adapter conformance: releasing removes every subscription and nothing reports afterwards.",
  );
});

test("an adapter whose refresh reports nothing fails", async () => {
  await expect(
    testNetworkAdapter(() => createHarness({ refreshReports: false })),
  ).rejects.toThrow(
    "Network adapter conformance: a refresh settles and reports within its capabilities.",
  );
});

test("an adapter whose cleanup throws fails", async () => {
  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((task) => {
    try {
      task();
    } catch {
      // The rethrown cleanup error is what the check reports.
    }
  });

  await expect(
    testNetworkAdapter(() => createHarness({ cleanupThrows: true })),
  ).rejects.toThrow(
    "Network adapter conformance: releasing removes every subscription and nothing reports afterwards.",
  );
});

test("a failing check leaves no session of its own behind", async () => {
  const harnesses: NetworkAdapterHarness[] = [];

  const capabilities: NetworkCapabilities = {
    ...MOCK_CAPABILITIES,
    "cost.metered": { support: "unsupported" },
  };

  await expect(
    testNetworkAdapter(() => {
      const harness = createHarness({ capabilities });

      harnesses.push(harness);

      return harness;
    }),
  ).rejects.toThrow();

  expect(harnesses.map((harness) => harness.subscriptionCount())).toEqual(
    harnesses.map(() => 0),
  );
});
