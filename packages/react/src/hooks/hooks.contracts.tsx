// Typechecked, never run: selections are inferred, equality takes only the
// selected type, and any Reach fits the provider and the hooks.
import { Reach } from "@priemskiyyy/reach";
import type { ConditionStatus, ConnectionStatus } from "@priemskiyyy/reach";
import { createMockEndpoint, createMockNetwork } from "@priemskiyyy/reach/mock";

import { ReachProvider } from "src/context/ReachProvider";
import { useCondition } from "src/hooks/useCondition";
import { useEndpoint } from "src/hooks/useEndpoint";
import { useNetwork } from "src/hooks/useNetwork";

const network = new Reach({
  adapter: createMockNetwork().adapter,
  endpoints: { api: createMockEndpoint({ staleAfter: 1_000 }).definition },
});

export const provider = <ReachProvider network={network} start />;

export const useContracts = () => {
  const status: ConnectionStatus = useNetwork(
    network,
    (state) => state.connection.status,
  );

  const met: ConditionStatus = useCondition(
    network.condition({ internet: "online" }),
    ({ status }) => status,
  );

  const checking: boolean = useEndpoint(
    network.endpoint("api"),
    (state) => state.checking,
  );

  useNetwork(network, (state) => state.connection.type, {
    // @ts-expect-error Equality compares the selected type, nothing else.
    isEqual: (previous: number, next: number) => previous === next,
  });

  // @ts-expect-error Endpoints are read through their typed handle, never a name.
  useEndpoint("api");

  // @ts-expect-error A selection that reads a missing field fails to compile.
  useNetwork(network, (state) => state.connection.speed);

  return { status, met, checking };
};
