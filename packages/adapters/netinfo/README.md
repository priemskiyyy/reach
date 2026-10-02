# @priemskiyyy/reach-netinfo

The React Native [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo) source for [Reach](https://github.com/priemskiyyy/reach/tree/main/packages/core), on iOS and Android. It maps NetInfo's reports conservatively: an ambiguous answer stays unknown instead of becoming offline.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-netinfo @react-native-community/netinfo
```

## Create a Reach

```ts
import { Reach } from "@priemskiyyy/reach";
import { netInfo } from "@priemskiyyy/reach-netinfo";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

const network = new Reach({
  adapter: netInfo({ sdk: NetInfo, platform: Platform.OS }),
});

network.start();
```

The adapter borrows the NetInfo module you pass. It never calls `configure`: NetInfo's configuration is global and yours. If you reconfigure NetInfo in a way that drops its listeners, restart the Reach runtime afterwards.

## Mapping

| NetInfo reports                                                | Reach reads                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| a known type and `isConnected: true`                           | `connected`, with that type, on `native-path`                        |
| `type: "none"` and `isConnected: false`                        | `disconnected`, type `none`, and internet `offline` on `native-path` |
| `isInternetReachable: true`                                    | internet `online` on `provider-report`, never verified by Reach      |
| `isInternetReachable: false` while connected                   | internet `unknown`, `source-ambiguous`                               |
| `isInternetReachable: null`                                    | internet `unknown`                                                   |
| an unknown type                                                | connection `unknown`                                                 |
| `isConnected: false` without `none`, or `none` without `false` | connection `unknown`, `source-ambiguous`                             |
| Android `details.isConnectionExpensive`                        | `metered` on `native-metering`; `expensive` stays unsupported        |
| iOS `details.isConnectionExpensive`                            | nothing: iOS derives it from the cellular transport                  |

A false reachability while connected can be a failed check or one NetInfo skipped, so it is never offline. The transport set, expense and data preferences are unsupported, so a condition that requires `constrained: false` cannot be met with NetInfo.

## Options

| Option     | Default    | Meaning                                                                                   |
| ---------- | ---------- | ----------------------------------------------------------------------------------------- |
| `sdk`      | required   | NetInfo's default export.                                                                 |
| `platform` | required   | `Platform.OS`. Only `ios` and `android` are mapped.                                       |
| `internet` | `reported` | `ignore` leaves NetInfo's reachability out of the internet fact, which stays unsupported. |

`internet: "ignore"` changes what Reach reads, not what NetInfo does: NetInfo keeps sending its own reachability requests. Configure those in NetInfo itself.

## Behavior

- Anywhere but iOS and Android, the web included, the adapter is unavailable: the runtime starts with every fact `unsupported`, for the reason `source-unavailable`. NetInfo's web module reads the browser under other names; use [the browser adapter](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/browser) there.
- The adapter subscribes before its first `fetch()`, so a change that arrives during that read wins over it.
- Releasing removes only the adapter's own listener. Other NetInfo listeners in your application stay.
- `refresh()` calls `NetInfo.refresh()`.
- `native` is the NetInfo module you passed.

## Tests

The tests run against an in-process fake modeled on NetInfo 12.0.1, through the shared adapter conformance suite on both platforms, and a type contract proves NetInfo's real module and state fit. On 2026-10-02 the adapter ran by hand in the Expo example's Release builds, over NetInfo 12.0.1, on an Android emulator (API 36) and an iOS 26.5 simulator, with Expo SDK 57 and React Native 0.86.3. On Android, airplane mode, Wi-Fi and mobile data were toggled and the app was sent to the background with the network changed; on both, the runtime lease was cycled five times. No physical device has been used. On iOS no network change was made, and whether events still arrive after a restart was not checked. [The verification matrix](https://priemskiyyy.github.io/reach/verification#run-on-an-android-emulator-and-an-ios-simulator) says what was seen.

## License

MIT
