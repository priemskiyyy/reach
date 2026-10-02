---
description: "Which Reach packages to install for the web, React Native and Expo, and what each requires."
---

# Installation

Every package is ESM only, side-effect free and typed. The core has no dependencies, and no adapter bundles or imports its SDK: you pass in the one your application already set up.

```sh
pnpm add @priemskiyyy/reach
```

Then add one adapter for your platform, and the optional packages you need. The table lists the packages in the order they are published.

| Package                                                                                                            | Install when                                  | Requires                                  |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ----------------------------------------- |
| [`@priemskiyyy/reach`](https://github.com/priemskiyyy/reach/tree/main/packages/core)                               | always                                        | nothing                                   |
| [`@priemskiyyy/reach-browser`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/browser)           | on the web                                    | a browser at run time                     |
| [`@priemskiyyy/reach-netinfo`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/netinfo)           | in React Native, including Expo               | `@react-native-community/netinfo` 12.0.1+ |
| [`@priemskiyyy/reach-expo-network`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/expo-network) | in Expo SDK 58 and later                      | `expo-network` 58.0.1+                    |
| [`@priemskiyyy/reach-http`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/http)                 | to check your own API through your own client | nothing                                   |
| [`@priemskiyyy/reach-react`](https://github.com/priemskiyyy/reach/tree/main/packages/react)                        | for React hooks and a provider                | React 19.2+                               |
| [`@priemskiyyy/reach-solid`](https://github.com/priemskiyyy/reach/tree/main/packages/solid)                        | for Solid primitives and a provider           | Solid 1.9.15+                             |
| [`@priemskiyyy/reach-vue`](https://github.com/priemskiyyy/reach/tree/main/packages/vue)                            | for Vue composables and a provider            | Vue 3.5.42+                               |
| [`@priemskiyyy/reach-svelte`](https://github.com/priemskiyyy/reach/tree/main/packages/svelte)                      | for Svelte utilities and a provider           | Svelte 5.57+                              |
| [`@priemskiyyy/reach-tanstack-query`](https://github.com/priemskiyyy/reach/tree/main/packages/tanstack-query)      | to drive TanStack Query's online manager      | nothing; it imports nothing from Query    |

Each adapter and binding requires `@priemskiyyy/reach` 0.1 as a peer. A peer floor is a version the repository's tests run against: React's oldest and newest in CI, and the lockfile's version of every other peer.

## Runtimes

- Node 22.18 or later for tests and server rendering. On a server, the browser adapter is unavailable, and the runtime starts with every fact `unsupported` instead of failing.
- Any browser with `EventTarget` and `AbortController`. The Network Information API is optional and detected per property.
- React Native on iOS and Android. On React Native for the web, the native adapters are unavailable; use the browser adapter there.

## Module resolution

The types of every package's main entry resolve under any TypeScript `moduleResolution`. `@priemskiyyy/reach/mock` and `@priemskiyyy/reach/testing` are subpath exports, which TypeScript finds only under `node16`, `nodenext` or `bundler`. Under the older `node` resolution they fail with `TS2307`, and the fix is the setting, not the import.

## Jest

Every package is ESM only, and Jest does not transform `node_modules` by default. A Jest setup that imports them needs the `@priemskiyyy` scope left out of `transformIgnorePatterns`, so that it is transformed. This is untested with jest-expo and the React Native Jest preset.

## Size

`pnpm test:size` bundles every built entry as a consumer gets it, minified and gzipped with peers external. It prints the measured sizes and fails when an entry is over its budget, and the budgets are in `scripts/measure-size.mjs`.

## Subpaths

`@priemskiyyy/reach/mock` holds the mock network, mock endpoint and test clock, and `@priemskiyyy/reach/testing` holds the adapter conformance suite. Neither is imported by the main entry. See [application testing](testing.md) and [writing an adapter](writing-an-adapter.md).
