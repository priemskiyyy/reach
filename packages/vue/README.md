# @priemskiyyy/reach-vue

Vue bindings for [Reach](../core): composables that read network state, conditions and endpoints as read-only computed refs, and a provider that can hold a runtime lease. The composables observe only. They never start the runtime, check an endpoint or subscribe to diagnostics.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-vue
```

Requires Vue 3.5 or later.

## Read the network

```ts
import { useCondition, useNetwork } from "@priemskiyyy/reach-vue";
import { computed } from "vue";

export const useUploadStatus = () => {
  const connection = useNetwork(network, (state) => state.connection.status);

  const online = useCondition(
    network.condition({ internet: "online" }),
    ({ status }) => status,
  );

  return computed(() => `${connection.value}, internet ${online.value}`);
};
```

## Composables

| Composable                                     | Reads, as a computed ref                                           |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `useNetwork()`                                 | the provider's network state                                       |
| `useNetwork(network, selector?, options?)`     | a Reach's network state, or a selection of it                      |
| `useCondition(condition, selector?, options?)` | a condition's state, or a selection of it                          |
| `useEndpoint(endpoint, selector?, options?)`   | an endpoint handle's state, or a selection of it                   |
| `useReach()`                                   | the provider's Reach, for `useNetwork(useReach().value, selector)` |

- A ref notifies only when what it reads changes. With a selector, that is when the selection changes. `options.isEqual`, `Object.is` by default, decides.
- The composables subscribe once mounted and unsubscribe on unmount.
- A composable that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the tree below: `<ReachProvider :network="network" start>`. With `start`, it holds a runtime lease while mounted and releases only that lease on unmount. It never disposes the Reach, and it starts no endpoint monitor.

## Server rendering

On the server and until mounted, the composables read deterministic snapshots: every fact unknown, every condition `unknown` with the reason `unobserved`, and every endpoint never checked and unscoped.

## License

MIT
