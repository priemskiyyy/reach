import { Reach } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import { createSSRApp, defineComponent, h } from "vue";

import { useCondition } from "src/composables/useCondition";
import { useEndpoint } from "src/composables/useEndpoint";
import { useNetwork } from "src/composables/useNetwork";
import { ReachProvider } from "src/context/ReachProvider";

// A connected, online Reach whose view reads a fact, a condition and an endpoint below a starting provider.
export const createView = () => {
  const mock = createMockNetwork({
    initial: {
      connection: { status: observed("connected", "native-path") },
      internet: { status: observed("online", "native-validation") },
    },
  });

  const probe = createMockEndpoint({ staleAfter: 30_000 });

  const network = new Reach({
    adapter: mock.adapter,
    clock: createTestClock({ now: 1_000 }),
    endpoints: { api: probe.definition },
  });

  const online = network.condition({ internet: "online" });
  const api = network.endpoint("api");

  const View = defineComponent(() => {
    const connection = useNetwork(network, (state) => state.connection.status);
    const internet = useCondition(online, ({ status }) => status);
    const endpoint = useEndpoint(api, ({ freshness }) => freshness);

    return () =>
      h("span", `${connection.value}/${internet.value}/${endpoint.value}`);
  });

  const createApp = () =>
    createSSRApp(() =>
      h(ReachProvider, { network, start: true }, () => h(View)),
    );

  return { mock, probe, network, createApp };
};
