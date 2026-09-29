<script lang="ts">
  import ReachProvider from "../context/ReachProvider.svelte";
  import type { ReachNetwork } from "../types/ReachNetwork.js";
  import View from "./View.fixture.svelte";

  type Props = {
    network: ReachNetwork;
    start?: boolean | undefined;
    read: () => void;
  };

  const props: Props = $props();
</script>

<ReachProvider network={props.network} start={props.start}
  ><View read={props.read} /></ReachProvider
>
