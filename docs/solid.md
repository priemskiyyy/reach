---
description: "@priemskiyyy/reach-solid: a provider and primitives that observe network state, conditions and endpoints as accessors without creating demand."
---

# Solid

`@priemskiyyy/reach-solid` reads a Reach in Solid 1.9 and later. It has the same provider and the same five names as [`@priemskiyyy/reach-react`](react.md), and every primitive returns an accessor. The primitives observe only: they never start the runtime, check an endpoint or monitor one.

```sh
pnpm add @priemskiyyy/reach-solid
```

## Publish and read

```ts
import {
  useCondition,
  useEndpoint,
  useNetwork,
} from "@priemskiyyy/reach-solid";

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

  return () =>
    `${connection()}, internet ${online()}${checking() ? ", checking the API" : ""}`;
};
```

- `useNetwork()` reads the provider's Reach; `useNetwork(network, selector?, options?)` reads the one passed in. `useCondition` and `useEndpoint` read a condition and an endpoint handle, and `useReach()` returns the provider's Reach as an accessor.
- With a selector, the accessor notifies only when the selection changes. `options.isEqual`, `Object.is` by default, decides.
- A primitive that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the tree below, as `<ReachProvider network={network} start>`, and follows a new `network` prop. With `start`, it holds a runtime lease while mounted and releases only that lease on cleanup. It never disposes the Reach, and it starts no endpoint monitor.

## Server rendering

Effects never run on the server, so the provider holds no lease there, and the primitives subscribe only once mounted. Until then they read the same deterministic snapshots as the React binding: every fact unknown, every condition `unknown` with the reason `unobserved`, and every endpoint never checked and unscoped. Hydration claims the server markup as it is.
