---
description: "@priemskiyyy/reach-vue: a provider and composables that observe network state, conditions and endpoints as computed refs without creating demand."
---

# Vue

`@priemskiyyy/reach-vue` reads a Reach in Vue 3.5 and later. It has the same provider and the same five names as [`@priemskiyyy/reach-react`](react.md), and every composable returns a read-only computed ref. The composables observe only: they never start the runtime, check an endpoint or monitor one.

```sh
pnpm add @priemskiyyy/reach-vue
```

## Publish and read

```ts
import { useCondition, useEndpoint, useNetwork } from "@priemskiyyy/reach-vue";
import { computed } from "vue";

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

  return computed(
    () =>
      `${connection.value}, internet ${online.value}${checking.value ? ", checking the API" : ""}`,
  );
};
```

- `useNetwork()` reads the provider's Reach; `useNetwork(network, selector?, options?)` reads the one passed in. `useCondition` and `useEndpoint` read a condition and an endpoint handle, and `useReach()` returns the provider's Reach as a computed ref.
- With a selector, the ref notifies only when the selection changes. `options.isEqual`, `Object.is` by default, decides.
- A composable that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the tree below, as `<ReachProvider :network="network" start>`, and follows a new `network` prop. With `start`, it holds a runtime lease while mounted and releases only that lease on unmount. It never disposes the Reach, and it starts no endpoint monitor.

## Server rendering

Mounted hooks never run on the server, so the provider holds no lease there, and the composables subscribe only once mounted. Until then they read the same deterministic snapshots as the React binding: every fact unknown, every condition `unknown` with the reason `unobserved`, and every endpoint never checked and unscoped. The server and the hydrating client render the same markup.
