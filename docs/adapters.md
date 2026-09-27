---
description: "What each Reach source can observe, on what basis, and which one to use on the web, in React Native and in Expo."
---

# Choose an adapter

One Reach reads one source. Choose it by platform:

| Platform                  | Adapter                                              |
| ------------------------- | ---------------------------------------------------- |
| a browser                 | `browser()` from `@priemskiyyy/reach-browser`        |
| React Native, Expo SDK 57 | `netInfo()` from `@priemskiyyy/reach-netinfo`        |
| Expo SDK 58 and later     | `expoNetwork()` or `netInfo()`                       |
| tests                     | `createMockNetwork()` from `@priemskiyyy/reach/mock` |

## What each one can tell

| Fact                      | Browser                        | NetInfo, iOS                        | NetInfo, Android                    | Expo Network, iOS | Expo Network, Android |
| ------------------------- | ------------------------------ | ----------------------------------- | ----------------------------------- | ----------------- | --------------------- |
| `connection.status`       | hint                           | native path                         | native path                         | native path       | native path           |
| `connection.type`         | hint, where exposed            | native path                         | native path                         | native path       | native path           |
| `connection.transports`   | unsupported                    | unsupported                         | unsupported                         | unsupported       | unsupported           |
| `internet.status`         | unsupported                    | provider report; offline on no path | provider report; offline on no path | offline only      | native validation     |
| `cost.metered`            | unsupported                    | unsupported                         | native metering                     | unsupported       | unsupported           |
| `cost.expensive`          | unsupported                    | unsupported                         | unsupported                         | unsupported       | unsupported           |
| `preferences.constrained` | unsupported                    | unsupported                         | unsupported                         | unsupported       | unsupported           |
| `preferences.saveData`    | user preference, where exposed | unsupported                         | unsupported                         | unsupported       | unsupported           |

The exact mapping, including every ambiguous answer, is in each adapter's README: [browser](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/browser), [NetInfo](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/netinfo) and [Expo Network](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/expo-network).

## What the table means for you

- **Internet on the web is never known.** A browser can say it has a link, not that the internet works. Check your own [endpoint](endpoints.md) for that.
- **Metering is Android's, through NetInfo.** Everywhere else a metering condition stays `unknown`. Decide what that means for your feature on the [deciding on unknown](unknown.md) page; do not treat it as unmetered.
- **A false answer is often not offline.** NetInfo's reachability is false after its own request failed, Expo Network's iOS read answers a timeout the same way as no path, and Android answers `UNKNOWN` after an exception it swallowed. Each of those is `unknown` with `source-ambiguous`.
- **A host without the source is not an error.** On a server, the browser adapter is unavailable; on the web, both native adapters are. The runtime starts with every fact `unsupported`, for the reason `source-unavailable`.

## Borrowed SDKs

The native adapters take the SDK your application already set up, and never configure it. NetInfo keeps sending its own reachability requests whatever Reach reads: `internet: "ignore"` changes what Reach reads, not what NetInfo does. Releasing a session removes only the adapter's own listener.

## Your own source

Any object with a `name`, `available()` and `open(context)` is an adapter. See [writing an adapter](writing-an-adapter.md), and run the conformance suite against it.
