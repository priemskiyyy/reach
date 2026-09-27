# @priemskiyyy/reach-expo-network

The [Expo Network](https://docs.expo.dev/versions/latest/sdk/network/) source for [Reach](../../core), on iOS and Android. Each platform reports different things through the same fields, so the mapping is per platform.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-expo-network
npx expo install expo-network
```

## Create a Reach

```ts
import { Reach } from "@priemskiyyy/reach";
import { expoNetwork } from "@priemskiyyy/reach-expo-network";
import * as Network from "expo-network";
import { Platform } from "react-native";

const network = new Reach({
  adapter: expoNetwork({ sdk: Network, platform: Platform.OS }),
});

network.start();
```

## Mapping

| Expo Network reports                     | Reach reads                                                      |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `isConnected: true`                      | `connected`, with the type when Expo names one, on `native-path` |
| a live `NONE` event on iOS               | `disconnected`, type `none`, internet `offline` on `native-path` |
| a `NONE` read on iOS, initial or refresh | `unknown`, `source-ambiguous`                                    |
| `NONE` on Android, event or read         | `disconnected`, type `none`, internet `offline` on `native-path` |
| `UNKNOWN` with every flag false          | `unknown`, `source-ambiguous`                                    |
| `isInternetReachable: true` on Android   | internet `online` on `native-validation`                         |
| `isInternetReachable: false` on Android  | internet `unknown`, `source-ambiguous`                           |
| `isInternetReachable` on iOS             | nothing: iOS copies the path status into it                      |

Why the iOS read is not trusted: `expo-network` 58 reads the path with a temporary monitor that gives up after five seconds, and answers a timeout with the same `NONE` tuple as no path. Its live events come from a real path, so a live `NONE` is.

Why Android's `UNKNOWN` is not trusted: Android answers `UNKNOWN` with every flag false after an exception it swallows, which says nothing about the network.

Android's reachability is a validated network: internet capability, validation and a usable connection. A false one cannot tell which of those failed, so it is never offline.

No cost, expense or data preference is reported, and no transport set. A condition on `metered` stays `unknown`: use [NetInfo](../netinfo) on Android if you need metering.

## Options

| Option     | Default  | Meaning                                             |
| ---------- | -------- | --------------------------------------------------- |
| `sdk`      | required | `import * as Network from "expo-network"`.          |
| `platform` | required | `Platform.OS`. Only `ios` and `android` are mapped. |

## Behavior

- On the web the adapter refuses to open with `UNSUPPORTED_ENVIRONMENT`. Use [the browser adapter](../browser) there.
- The adapter subscribes before its first read, so a change that arrives during that read wins over it.
- It never calls the IP address or airplane mode helpers.
- Releasing removes only the adapter's own subscription.
- `refresh()` reads `getNetworkStateAsync()` again, which on iOS cannot confirm no path.
- `native` is the module you passed.

## Tests

The mapping was read from the iOS and Android sources of `expo-network` 58.0.1. The tests run against an in-process fake modeled on them, through the shared adapter conformance suite on both platforms, and a type contract proves the real module and state fit. Nothing has run on a device yet: on iOS, the module cancels its path monitor when the last listener goes, and whether a later listener hears it again is unverified.
