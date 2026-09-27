---
description: "Which Reach packages to install for the web, React Native and Expo, and what each requires."
---

# Installation

Every package is ESM only, side-effect free and typed. The core has no dependencies, and no adapter bundles or imports its SDK: you pass in the one your application already set up.

```sh
pnpm add @priemskiyyy/reach
```

Then add one adapter for your platform, and the optional packages you need.

| Package                                                                                                            | Install when                                  | Requires                                |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------------- |
| [`@priemskiyyy/reach-browser`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/browser)           | on the web                                    | a browser at run time                   |
| [`@priemskiyyy/reach-netinfo`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/netinfo)           | in React Native, including Expo               | `@react-native-community/netinfo` 11.4+ |
| [`@priemskiyyy/reach-expo-network`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/expo-network) | in Expo SDK 58 and later                      | `expo-network` 58+                      |
| [`@priemskiyyy/reach-http`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/http)                 | to check your own API through your own client | nothing                                 |
| [`@priemskiyyy/reach-react`](https://github.com/priemskiyyy/reach/tree/main/packages/react)                        | for hooks and a provider                      | React 19.2+                             |
| [`@priemskiyyy/reach-tanstack-query`](https://github.com/priemskiyyy/reach/tree/main/packages/tanstack-query)      | to drive TanStack Query's online manager      | nothing; it imports nothing from Query  |

Each adapter and binding requires `@priemskiyyy/reach` 0.1 as a peer.

## Runtimes

- Node 22.18 or later for tests and server rendering. On a server, the browser adapter is unavailable, and the runtime starts with every fact `unsupported` instead of failing.
- Any browser with `EventTarget` and `AbortController`. The Network Information API is optional and detected per property.
- React Native on iOS and Android. On React Native for the web, the native adapters are unavailable; use the browser adapter there.

## Subpaths

`@priemskiyyy/reach/mock` holds the mock network, mock endpoint and test clock, and `@priemskiyyy/reach/testing` holds the adapter conformance suite. Neither is imported by the main entry. See [application testing](testing.md) and [writing an adapter](writing-an-adapter.md).
