<script lang="ts">
  import type { Condition, EndpointHandle } from "@priemskiyyy/reach";
  import type { ReachNetwork } from "../types/ReachNetwork.js";
  import ReachProvider from "./ReachProvider.svelte";
  import Status from "./Status.fixture.svelte";

  type Props = {
    network: ReachNetwork;
    online: Condition;
    api: EndpointHandle;
  };

  const props: Props = $props();
</script>

<ReachProvider network={props.network} start
  ><Status
    network={props.network}
    online={props.online}
    api={props.api}
  /></ReachProvider
>
