// Typechecked, never run: each `@ts-expect-error` is a rule the types enforce
// so that Reach does not check it again at runtime.
import { expectTypeOf } from "vitest";

import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import type { ConditionStatus } from "src/types/ConditionStatus";
import type { EndpointState } from "src/types/EndpointState";
import type { FieldObservation } from "src/types/FieldObservation";
import type { NetworkAdapter } from "src/types/NetworkAdapter";
import type { NetworkState } from "src/types/NetworkState";
import type { ObservableValue } from "src/types/ObservableValue";
import { all } from "src/utils/all";
import { any } from "src/utils/any";
import { createCondition } from "src/utils/createCondition";
import { not } from "src/utils/not";
import { Reach } from "src/utils/Reach";

declare const settings: ObservableValue<{ allowAnyNetwork: boolean }>;

const adapter: NetworkAdapter<{ sourceMethod: (value: number) => number }> = {
  name: "contract",
  open: (context) => {
    context.onDispose(() => {});

    return {
      native: { sourceMethod: (value) => value + 1 },
      capabilities: MOCK_CAPABILITIES,
      refresh: async () => {},
    };
  },
};

const reach = new Reach({ adapter });

export const nativeResult: number | undefined = reach.native
  .get()
  ?.sourceMethod(2);

expectTypeOf(reach.state.get()).toEqualTypeOf<NetworkState>();

// @ts-expect-error The native handle keeps the provider's own type.
reach.native.get()?.unavailableMethod();

export const bulk = reach.condition({ internet: "online", metered: false });

// @ts-expect-error T058 An empty requirement would always be met.
reach.condition({});

// @ts-expect-error Unknown is what a condition answers, never what it requires.
reach.condition({ internet: "unknown" });

// @ts-expect-error A requirement names only known facts.
reach.condition({ metered: false, imaginary: true });

// @ts-expect-error Cost is a boolean fact.
reach.condition({ metered: "no" });

// @ts-expect-error T057 all needs at least one condition.
all();

// @ts-expect-error T057 any needs at least one condition.
any();

export const composed = not(any(bulk, all(bulk, bulk)));

export const policy = createCondition({
  sources: { network: reach.state, settings },
  evaluate: ({ network, settings: preferences }) => {
    expectTypeOf(network).toEqualTypeOf<NetworkState>();
    expectTypeOf(preferences.allowAnyNetwork).toEqualTypeOf<boolean>();

    return preferences.allowAnyNetwork ? "met" : "unknown";
  },
});

createCondition({
  sources: { settings },
  // @ts-expect-error An evaluator is synchronous; a condition never waits.
  evaluate: async (): Promise<ConditionStatus> => "met",
});

// @ts-expect-error A current fact always carries its value.
export const withoutValue: FieldObservation<boolean> = {
  status: "current",
  basis: "custom",
};

export const unsupportedWithValue: FieldObservation<boolean> = {
  status: "unsupported",
  // @ts-expect-error An unsupported fact has no value to read as false.
  value: false,
};

export const withoutBasis: FieldObservation<boolean> = {
  status: "current",
  value: true,
  // @ts-expect-error A current fact rests on something.
  basis: "none",
};

export const asynchronousOpen: NetworkAdapter<null> = {
  name: "async",
  open: async () => ({ native: null, capabilities: MOCK_CAPABILITIES }),
};

const withEndpoints = new Reach({
  adapter,
  endpoints: {
    api: {
      staleAfter: 30_000,
      check: () => ({ verdict: "pass", response: "received" }),
    },
    internal: {
      staleAfter: 20_000,
      check: async ({ network }) => ({
        verdict:
          network.connection.status === "connected" ? "pass" : "inconclusive",
        response: "unknown",
      }),
    },
  },
});

expectTypeOf(
  withEndpoints.endpoint("api").state.get(),
).toEqualTypeOf<EndpointState>();

export const available = all(
  withEndpoints.endpoint("internal").available,
  withEndpoints.condition({ metered: false }),
);

// @ts-expect-error T157 An endpoint that was never defined fails to compile.
withEndpoints.endpoint("missing");

// @ts-expect-error A Reach without endpoints has none to name.
reach.endpoint("api");

export const badVerdict = new Reach({
  adapter,
  endpoints: {
    api: {
      staleAfter: 1,
      // @ts-expect-error A verdict is pass, fail or inconclusive.
      check: () => ({ verdict: "ok", response: "received" }),
    },
  },
});

export const badPolicy = new Reach({
  adapter,
  endpoints: {
    api: {
      staleAfter: 1,
      check: () => ({ verdict: "pass", response: "received" }),
      // @ts-expect-error Triggers are start, network-change, foreground and scope-change.
      monitoring: { on: ["stale"] },
    },
  },
});
