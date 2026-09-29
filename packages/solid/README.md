# @priemskiyyy/reach-solid

Solid bindings for [Reach](../core): primitives that read network state, conditions and endpoints as accessors, and a provider that can hold a runtime lease. The primitives observe only. They never start the runtime, check an endpoint or subscribe to diagnostics.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-solid
```

Requires Solid 1.9 or later.

## Read the network

```ts
import { useCondition, useNetwork } from "@priemskiyyy/reach-solid";

export const useUploadStatus = () => {
  const connection = useNetwork(network, (state) => state.connection.status);

  const online = useCondition(
    network.condition({ internet: "online" }),
    ({ status }) => status,
  );

  return () => `${connection()}, internet ${online()}`;
};
```

## Primitives

| Primitive                                      | Reads, as an accessor                                          |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `useNetwork()`                                 | the provider's network state                                   |
| `useNetwork(network, selector?, options?)`     | a Reach's network state, or a selection of it                  |
| `useCondition(condition, selector?, options?)` | a condition's state, or a selection of it                      |
| `useEndpoint(endpoint, selector?, options?)`   | an endpoint handle's state, or a selection of it               |
| `useReach()`                                   | the provider's Reach, for `useNetwork(useReach()(), selector)` |

- An accessor notifies only when what it reads changes. With a selector, that is when the selection changes. `options.isEqual`, `Object.is` by default, decides.
- The primitives subscribe once mounted and unsubscribe when their owner is disposed.
- A primitive that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the tree below: `<ReachProvider network={network} start>`. With `start`, it holds a runtime lease while mounted and releases only that lease on cleanup. It never disposes the Reach, and it starts no endpoint monitor.

## Server rendering

On the server and until mounted, the primitives read deterministic snapshots: every fact unknown, every condition `unknown` with the reason `unobserved`, and every endpoint never checked and unscoped.

## License

MIT
