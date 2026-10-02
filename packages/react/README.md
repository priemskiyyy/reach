# @priemskiyyy/reach-react

React bindings for [Reach](https://github.com/priemskiyyy/reach/tree/main/packages/core): hooks that read network state, conditions and endpoints, and a provider that can hold a runtime lease. The hooks observe only. They never start the runtime, check an endpoint or subscribe to diagnostics.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-react
```

Requires React 19.2 or later.

## Read the network

```tsx
import {
  ReachProvider,
  useCondition,
  useEndpoint,
  useNetwork,
} from "@priemskiyyy/reach-react";

const internet = network.condition({ internet: "online" });

const UploadStatus = () => {
  const connection = useNetwork(network, (state) => state.connection.status);
  const online = useCondition(internet, ({ status }) => status);
  const checking = useEndpoint(
    network.endpoint("api"),
    (state) => state.checking,
  );

  return (
    <p>{`${connection}, internet ${online}${checking ? ", checking the API" : ""}`}</p>
  );
};

export const Application = () => (
  <ReachProvider network={network} start>
    <UploadStatus />
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

- A component renders again only when what it reads changes. With a selector, that is when the selection changes. `options.isEqual`, `Object.is` by default, decides; it takes only the type the selector returns.
- Hooks read through `useSyncExternalStore`, subscribe while mounted, and unsubscribe on unmount.
- Endpoints are read through their typed handle, `network.endpoint("api")`, never a name looked up in context.
- A hook that needs the provider throws a `ReachError` with `INVALID_CONFIGURATION` outside one.

## The provider

`ReachProvider` publishes a Reach to the tree below. With `start`, it holds a runtime lease while mounted and releases only that lease on unmount. Strict Mode's setup, cleanup and setup again takes one lease, releases it and takes another. The provider never disposes the Reach, and it starts no endpoint monitor.

## Server rendering

On the server and in the hydrating render, the hooks read deterministic snapshots: every fact unknown, every condition `unknown` with the reason `unobserved`, and every endpoint never checked and unscoped. A server cannot know the client's scope. Nothing about the server's own network reaches the client, and hydration never mismatches.

Create the Reach on the client, or one per request on the server: a started Reach is not a value to share between users.

## Tests

The tests render with React Testing Library in jsdom, over the mock network and mock endpoint from `@priemskiyyy/reach/mock`, and hydrate a server rendered string.

## License

MIT
