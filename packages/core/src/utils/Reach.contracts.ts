// Typechecked, never run: each `@ts-expect-error` is a rule the types enforce
// so that Reach does not check it again at runtime.
import { expectTypeOf } from "vitest";

import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import type { ConditionStatus } from "src/types/ConditionStatus";
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

// @ts-expect-error An empty requirement would always be met.
reach.condition({});

// @ts-expect-error Unknown is what a condition answers, never what it requires.
reach.condition({ internet: "unknown" });

// @ts-expect-error A requirement names only known facts.
reach.condition({ metered: false, imaginary: true });

// @ts-expect-error Cost is a boolean fact.
reach.condition({ metered: "no" });

// @ts-expect-error all needs at least one condition.
all();

// @ts-expect-error any needs at least one condition.
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
