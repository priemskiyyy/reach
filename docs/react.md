---
description: "@priemskiyyy/reach-react: a provider and hooks that observe network state, conditions and endpoints without creating demand."
---

# React

`@priemskiyyy/reach-react` reads a Reach in React 19.2 and later. The hooks observe only: they never start the runtime, check an endpoint or monitor one.

```sh
pnpm add @priemskiyyy/reach-react
```

## Publish and read

```tsx
import {
  ReachProvider,
  useCondition,
  useEndpoint,
  useNetwork,
} from "@priemskiyyy/reach-react";

const internet = network.condition({ internet: "online" });
const api = network.endpoint("api");

const NetworkStatus = () => {
  const connection = useNetwork(network, (state) => state.connection.status);
  const online = useCondition(internet, ({ status }) => status);
  const checking = useEndpoint(api, (state) => state.checking);

  return (
    <p>{`${connection}, internet ${online}${checking ? ", checking the API" : ""}`}</p>
  );
};

export const Application = () => (
  <ReachProvider network={network} start>
    <NetworkStatus />
  </ReachProvider>
);
```

## Hooks

| Hook                                           | Reads                                                        |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `useNetwork()`                                 | the provider's network state                                 |
| `useNetwork(network, selector?, options?)`     | a Reach's network state, or a selection of it                |
| `useCondition(condition, selector?, options?)` | a condition's state, or a selection of it                    |
| `useEndpoint(endpoint, selector?, options?)`   | an endpoint handle's state, or a selection of it             |
| `useReach()`                                   | the provider's Reach, for `useNetwork(useReach(), selector)` |

- A component renders again only when what it reads changes. With a selector, that is when the selection changes; `options.isEqual`, `Object.is` by default, decides, and it takes only the type the selector returns.
- Hooks read through `useSyncExternalStore`, subscribe while mounted, and unsubscribe on unmount.
- Expiry is evaluated on read and pushed by a timer on the monotonic clock. After a sleep that paused that clock, a mounted view can show `available` for a result the wall clock has already expired, until the timer runs or something renders it again. Pass `activity` to the Reach, so that a return to the foreground ends older results and renders them again.
- An endpoint is read through its typed handle, `network.endpoint("api")`, never a name looked up in context.
- A hook that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the tree below. With `start`, it holds one runtime lease while mounted and releases only that lease on unmount. Strict Mode's setup, cleanup and setup again takes a lease, releases it and takes another. The provider never disposes the Reach and starts no monitor.

## Side effects stay yours

Checking, monitoring and deciding are effects. Keep them where your application keeps its effects, such as the component that owns a feature or a service outside React:

```tsx
import { useEffect } from "react";

export const ApiMonitor = () => {
  useEffect(() => network.endpoint("api").monitor(), []);

  return null;
};
```

`monitor()` returns its own release, so an effect cleans it up. Several mounted monitors share one policy.

## Server rendering

On the server and in the hydrating render, the hooks read deterministic unknown snapshots. See [server rendering](server-rendering.md).
