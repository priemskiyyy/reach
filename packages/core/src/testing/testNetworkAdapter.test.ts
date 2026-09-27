import { expect, test } from "vitest";

import { createObservation } from "src/mock/createObservation";
import { observed } from "src/mock/observed";
import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import { testNetworkAdapter } from "src/testing/testNetworkAdapter";
import type { NetworkAdapterHarness } from "src/testing/types/NetworkAdapterHarness";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";

// A host that toggles between Wi-Fi and cellular and counts its listeners.
const createHarness = ({
  capabilities = MOCK_CAPABILITIES,
  keepListener = false,
}: {
  capabilities?: NetworkCapabilities;
  keepListener?: boolean;
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
      open: (context) => {
        const listener = () => context.emit(report());

        listeners.add(listener);

        if (!keepListener) {
          context.onDispose(() => listeners.delete(listener));
        }

        context.emit(report());

        return {
          native: host,
          capabilities,
          refresh: ({ emit }) => emit(report()),
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
    "creating the adapter subscribes to nothing",
    "opening declares a capability for every fact",
    "every report is complete and within the declared capabilities",
    "a change of the host is reported",
    "releasing removes every subscription and nothing reports afterwards",
    "a second session after a release observes again",
    "a refresh settles and reports within its capabilities",
  ]);
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
