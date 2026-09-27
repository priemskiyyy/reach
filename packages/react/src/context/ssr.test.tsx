import { Reach } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, test, vi } from "vitest";

import { ReachProvider } from "src/context/ReachProvider";
import { useCondition } from "src/hooks/useCondition";
import { useEndpoint } from "src/hooks/useEndpoint";
import { useNetwork } from "src/hooks/useNetwork";

const create = () => {
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

  const View = () => {
    const connection = useNetwork(network, (state) => state.connection.status);
    const internet = useCondition(online, ({ status }) => status);
    const endpoint = useEndpoint(api, ({ freshness }) => freshness);

    return <span>{`${connection}/${internet}/${endpoint}`}</span>;
  };

  const view = (
    <ReachProvider network={network} start>
      <View />
    </ReachProvider>
  );

  return { mock, probe, network, view };
};

test("T146 a server render is unknown and inert, and hydration reads the same snapshot", async () => {
  const server = create();
  const html = renderToString(server.view);

  expect(html).toContain("unknown/unknown/never");
  expect(server.mock.stats().opens).toBe(0);
  expect(server.probe.calls).toHaveLength(0);

  // The client already knows it is online, and still hydrates from the server's snapshot.
  const client = create();
  const lease = client.network.start();

  await lease.ready;

  const container = document.createElement("div");
  const onRecoverableError = vi.fn();

  container.innerHTML = html;

  await act(async () => {
    hydrateRoot(container, client.view, { onRecoverableError });
    await Promise.resolve();
  });

  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.textContent).toBe("connected/met/never");

  lease.release();
});
