---
description: "@priemskiyyy/reach-svelte: a provider and utilities that observe network state, conditions and endpoints through current without creating demand."
---

# Svelte

`@priemskiyyy/reach-svelte` reads a Reach in Svelte 5.7 and later. It has the same provider and the same five names as [`@priemskiyyy/reach-react`](react.md), and every utility returns a value read through `current`, the way Svelte's own reactive classes are. The utilities observe only: they never start the runtime, check an endpoint or monitor one. The package ships its sources for the application's Svelte compiler.

```sh
pnpm add @priemskiyyy/reach-svelte
```

## Publish and read

```svelte
<script lang="ts">
  import { ReachProvider } from "@priemskiyyy/reach-svelte";
  import NetworkStatus from "./NetworkStatus.svelte";
</script>

<ReachProvider {network} start><NetworkStatus /></ReachProvider>
```

```ts
import {
  useCondition,
  useEndpoint,
  useNetwork,
} from "@priemskiyyy/reach-svelte";

export const useNetworkStatus = () => {
  const connection = useNetwork(network, (state) => state.connection.status);

  const online = useCondition(
    network.condition({ internet: "online" }),
    ({ status }) => status,
  );

  const checking = useEndpoint(
    network.endpoint("api"),
    (state) => state.checking,
  );

  return {
    get current() {
      return `${connection.current}, internet ${online.current}${checking.current ? ", checking the API" : ""}`;
    },
  };
};
```

- `useNetwork()` reads the provider's Reach; `useNetwork(network, selector?, options?)` reads the one passed in. `useCondition` and `useEndpoint` read a condition and an endpoint handle, and `useReach()` returns the provider's Reach through `current`.
- With a selector, `current` changes only when the selection changes. `options.isEqual`, `Object.is` by default, decides.
- A utility that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the components below and follows a new `network` prop. With `start`, it holds a runtime lease while mounted and releases only that lease on unmount. It never disposes the Reach, and it starts no endpoint monitor.

## Server rendering

Effects never run on the server and run after mount on the client, so the provider holds no lease on the server, and the utilities subscribe only once mounted. Until then they read the same deterministic snapshots as the React binding: every fact unknown, every condition `unknown` with the reason `unobserved`, and every endpoint never checked and unscoped. The server and the hydrating client render the same markup.
