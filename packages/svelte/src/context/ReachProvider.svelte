<!--
@component Publishes one Reach to the components below. With `start`, it holds
a runtime lease while mounted and releases only that lease on unmount; it never
disposes the Reach, and it starts no endpoint monitor.
@example `<ReachProvider {network} start><Application /></ReachProvider>`
-->
<script lang="ts">
  import { setContext } from "svelte";
  import type { ReachNetwork } from "../types/ReachNetwork.js";
  import type { ReachProviderProps } from "../types/ReachProviderProps.js";
  import type { ReadableValue } from "../types/ReadableValue.js";
  import { REACH_CONTEXT } from "./ReachContext.js";

  const props: ReachProviderProps = $props();

  setContext(REACH_CONTEXT, {
    get current() {
      return props.network;
    },
  } satisfies ReadableValue<ReachNetwork>);

  // Effects never run on the server, so only a mounted provider holds a lease.
  $effect(() => {
    if (!props.start) {
      return;
    }

    return props.network.start().release;
  });
</script>

{#if props.children}
  {@render props.children()}
{/if}
