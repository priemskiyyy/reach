import type { NetworkAdapterConformanceReport } from "src/testing/types/NetworkAdapterConformanceReport";
import type { NetworkAdapterHarness } from "src/testing/types/NetworkAdapterHarness";
import type { FieldObservation } from "src/types/FieldObservation";
import type { NetworkAdapter } from "src/types/NetworkAdapter";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import type { NetworkField } from "src/types/NetworkField";
import type { NetworkObservation } from "src/types/NetworkObservation";
import { NETWORK_FIELDS } from "src/utils/constants/network";
import { createSystemClock } from "src/utils/internal/clock/createSystemClock";
import { Reach } from "src/utils/Reach";

type Check = {
  name: string;
  run: (harness: NetworkAdapterHarness) => Promise<void>;
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const getFields = ({
  connection,
  internet,
  cost,
  preferences,
}: NetworkObservation): Record<NetworkField, FieldObservation<unknown>> => ({
  "connection.status": connection.status,
  "connection.type": connection.type,
  "connection.transports": connection.transports,
  "internet.status": internet.status,
  "cost.metered": cost.metered,
  "cost.expensive": cost.expensive,
  "preferences.constrained": preferences.constrained,
  "preferences.saveData": preferences.saveData,
});

// A report must never claim more than the adapter declared it can observe.
const findContradictions = (
  observation: NetworkObservation,
  capabilities: NetworkCapabilities,
) => {
  const fields = getFields(observation);

  return NETWORK_FIELDS.flatMap((field) => {
    const reported = fields[field];
    const declared = capabilities[field];

    if (reported.status !== "current") {
      return [];
    }

    if (declared.support === "unsupported") {
      return [`${field} is reported current but declared unsupported`];
    }

    if (!declared.bases.includes(reported.basis)) {
      return [`${field} rests on ${reported.basis}, which is not declared`];
    }

    return [];
  });
};

// Every report the adapter makes is checked on its way to the core.
const inspect = (adapter: NetworkAdapter<unknown>) => {
  const observations: NetworkObservation[] = [];

  const holder: { capabilities: NetworkCapabilities | null } = {
    capabilities: null,
  };

  const inspected: NetworkAdapter<unknown> = {
    name: adapter.name,
    available: adapter.available,
    open: async (context) => {
      const record = (observation: NetworkObservation) => {
        observations.push(observation);
      };

      const session = await adapter.open({
        ...context,
        emit: (observation) => {
          record(observation);
          context.emit(observation);
        },
        reserve: () => {
          const slot = context.reserve();

          return {
            emit: (observation) => {
              record(observation);
              slot.emit(observation);
            },
            reportError: slot.reportError,
          };
        },
      });

      holder.capabilities = session.capabilities;

      const { refresh } = session;

      if (refresh === undefined) {
        return session;
      }

      return {
        ...session,
        refresh: (request) =>
          refresh({
            ...request,
            emit: (observation) => {
              record(observation);
              request.emit(observation);
            },
          }),
      };
    },
  };

  const getContradictions = () => {
    const { capabilities } = holder;

    if (capabilities === null) {
      return [];
    }

    return observations.flatMap((observation) =>
      findContradictions(observation, capabilities),
    );
  };

  return { adapter: inspected, observations, getContradictions };
};

const startReach = async (harness: NetworkAdapterHarness) => {
  const inspected = inspect(harness.adapter);

  // Real timers bound a hanging open or refresh, so a broken adapter fails instead of hanging.
  const reach = new Reach({
    adapter: inspected.adapter,
    clock: createSystemClock(),
    timeouts: { open: 2_000, refresh: 2_000 },
  });

  const lease = reach.start();

  await lease.ready;
  await harness.settle();

  return { reach, lease, inspected };
};

const CHECKS: Check[] = [
  {
    name: "creating and probing the adapter subscribes to nothing",
    run: async (harness) => {
      assert(
        harness.adapter.available(),
        "The adapter is unavailable on the host under test.",
      );
      assert(
        harness.subscriptionCount() === 0,
        "The adapter subscribed before it was opened.",
      );
    },
  },
  {
    name: "opening declares a capability for every fact",
    run: async (harness) => {
      const { reach } = await startReach(harness);
      const capabilities = reach.capabilities.get();

      assert(capabilities !== null, "The session declared no capabilities.");
      assert(
        NETWORK_FIELDS.every((field) => capabilities?.[field] !== undefined),
        "A fact has no declared capability.",
      );
      assert(
        harness.subscriptionCount() > 0,
        "The session subscribed to nothing.",
      );
      reach.dispose();
    },
  },
  {
    name: "every report is complete and within the declared capabilities",
    run: async (harness) => {
      const { reach, inspected } = await startReach(harness);

      await harness.change();
      await harness.settle();

      const contradictions = inspected.getContradictions();

      assert(
        inspected.observations.length > 0,
        "The adapter reported nothing.",
      );
      assert(contradictions.length === 0, contradictions.join("; "));
      reach.dispose();
    },
  },
  {
    name: "a change of the host is reported",
    run: async (harness) => {
      const { reach } = await startReach(harness);
      const { revision } = reach.state.get();

      await harness.change();
      await harness.settle();

      assert(
        reach.state.get().revision > revision,
        "The adapter did not report the host's change.",
      );
      reach.dispose();
    },
  },
  {
    name: "releasing removes every subscription and nothing reports afterwards",
    run: async (harness) => {
      const { reach, lease } = await startReach(harness);

      lease.release();

      assert(
        harness.subscriptionCount() === 0,
        "The adapter kept a subscription after its session ended.",
      );

      await harness.change();
      await harness.settle();

      assert(
        reach.diagnostics.get().counters.lateCallbacks === 0,
        "The adapter reported after its session ended.",
      );
      reach.dispose();
    },
  },
  {
    name: "a second session after a release observes again",
    run: async (harness) => {
      const { reach, lease } = await startReach(harness);

      lease.release();

      const second = reach.start();

      await second.ready;

      const { revision } = reach.state.get();

      await harness.change();
      await harness.settle();

      assert(
        reach.state.get().revision > revision,
        "The second session did not report the host's change.",
      );
      reach.dispose();

      assert(
        harness.subscriptionCount() === 0,
        "Disposing left a subscription behind.",
      );
    },
  },
  {
    name: "a refresh settles and reports within its capabilities",
    run: async (harness) => {
      const { reach, inspected } = await startReach(harness);

      await reach.refresh();

      const contradictions = inspected.getContradictions();

      assert(contradictions.length === 0, contradictions.join("; "));
      reach.dispose();
    },
  },
];

/**
 * Runs the contract every connectivity adapter must keep, each check over a
 * fresh harness from `createHarness`. It resolves with the passed checks and
 * rejects at the first failure; it needs no test runner.
 *
 * @example
 * ```ts
 * test("the adapter keeps the contract", async () => {
 *   const { passed } = await testNetworkAdapter(createHarness);
 *
 *   expect(passed.length).toBeGreaterThan(0);
 * });
 * ```
 */
export const testNetworkAdapter = async (
  createHarness: () => NetworkAdapterHarness,
): Promise<NetworkAdapterConformanceReport> => {
  const passed: string[] = [];

  for (const check of CHECKS) {
    try {
      await check.run(createHarness());
    } catch (error) {
      throw new Error(`Network adapter conformance: ${check.name}.`, {
        cause: error,
      });
    }

    passed.push(check.name);
  }

  return Object.freeze({ passed });
};
