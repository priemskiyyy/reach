import type { Condition, EndpointHandle } from "@priemskiyyy/reach";

import { ReachProvider } from "src/context/ReachProvider";
import { useCondition } from "src/primitives/useCondition";
import { useEndpoint } from "src/primitives/useEndpoint";
import { useNetwork } from "src/primitives/useNetwork";
import type { ReachNetwork } from "src/types/ReachNetwork";

type StatusProps = {
  network: ReachNetwork;
  online: Condition;
  api: EndpointHandle;
};

const Status = (props: StatusProps) => {
  const connection = useNetwork(
    props.network,
    (state) => state.connection.status,
  );

  const internet = useCondition(props.online, ({ status }) => status);
  const endpoint = useEndpoint(props.api, ({ freshness }) => freshness);

  return <span>{`${connection()}/${internet()}/${endpoint()}`}</span>;
};

export const StatusView = (props: StatusProps) => (
  <ReachProvider network={props.network} start>
    <Status network={props.network} online={props.online} api={props.api} />
  </ReachProvider>
);
