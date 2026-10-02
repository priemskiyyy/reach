# @priemskiyyy/reach-svelte

Svelte bindings for [Reach](https://github.com/priemskiyyy/reach/tree/main/packages/core): utilities that read network state, conditions and endpoints through `current`, and a provider that can hold a runtime lease. The utilities observe only. They never start the runtime, check an endpoint or subscribe to diagnostics.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-svelte
```

Requires Svelte 5.57 or later. The package ships its sources for your Svelte compiler.

## Read the network

```ts
import { useCondition, useNetwork } from "@priemskiyyy/reach-svelte";

export const useUploadStatus = () => {
  const connection = useNetwork(network, (state) => state.connection.status);

  const online = useCondition(
    network.condition({ internet: "online" }),
    ({ status }) => status,
  );

  return {
    get current() {
      return `${connection.current}, internet ${online.current}`;
    },
  };
};
```

## Utilities

| Utility                                        | Reads, through `current`                                             |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `useNetwork()`                                 | the provider's network state                                         |
| `useNetwork(network, selector?, options?)`     | a Reach's network state, or a selection of it                        |
| `useCondition(condition, selector?, options?)` | a condition's state, or a selection of it                            |
| `useEndpoint(endpoint, selector?, options?)`   | an endpoint handle's state, or a selection of it                     |
| `useReach()`                                   | the provider's Reach, for `useNetwork(useReach().current, selector)` |

- `current` changes only when what it reads changes. With a selector, that is when the selection changes. `options.isEqual`, `Object.is` by default, decides.
- The utilities subscribe once mounted and unsubscribe on unmount.
- A utility that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the tree below: `<ReachProvider {network} start>`. With `start`, it holds a runtime lease while mounted and releases only that lease on unmount. It never disposes the Reach, and it starts no endpoint monitor.

## Server rendering

On the server and until mounted, the utilities read deterministic snapshots: every fact unknown, every condition `unknown` with the reason `unobserved`, and every endpoint never checked and unscoped.

## License

MIT
