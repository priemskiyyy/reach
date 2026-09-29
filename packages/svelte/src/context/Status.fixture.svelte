<script lang="ts">
  import type { Condition, EndpointHandle } from "@priemskiyyy/reach";
  import type { ReachNetwork } from "../types/ReachNetwork.js";
  import { untrack } from "svelte";
  import { useCondition } from "../utilities/useCondition.js";
  import { useEndpoint } from "../utilities/useEndpoint.js";
  import { useNetwork } from "../utilities/useNetwork.js";

  type Props = {
    network: ReachNetwork;
    online: Condition;
    api: EndpointHandle;
  };

  const props: Props = $props();

  // Read once on purpose: the view reads one Reach, condition and endpoint.
  const { network, online, api } = untrack(() => props);

  const connection = useNetwork(network, (state) => state.connection.status);
  const internet = useCondition(online, ({ status }) => status);
  const endpoint = useEndpoint(api, ({ freshness }) => freshness);
</script>

<span>{connection.current}/{internet.current}/{endpoint.current}</span>
