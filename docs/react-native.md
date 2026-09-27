---
description: "Reach in React Native and Expo: NetInfo or Expo Network as the source, AppState as the activity, and what a native source cannot tell."
---

# React Native and Expo

A React Native application reads the network through NetInfo, or through Expo Network on Expo SDK 58 and later. Both adapters take the module your application already has, and `Platform.OS`.

## NetInfo

```ts
import { Reach } from "@priemskiyyy/reach";
import { netInfo } from "@priemskiyyy/reach-netinfo";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

export const network = new Reach({
  adapter: netInfo({ sdk: NetInfo, platform: Platform.OS }),
});

network.start();
```

NetInfo is borrowed: Reach never calls `configure`, and removes only its own listener. NetInfo keeps sending its own reachability requests whatever Reach reads; `internet: "ignore"` only leaves them out of Reach.

## Expo Network

```ts
import { Reach } from "@priemskiyyy/reach";
import { expoNetwork } from "@priemskiyyy/reach-expo-network";
import * as Network from "expo-network";
import { Platform } from "react-native";

export const network = new Reach({
  adapter: expoNetwork({ sdk: Network, platform: Platform.OS }),
});

network.start();
```

The mapping was read from `expo-network` 58. It reports no cost, expense or data preference, so a metering condition stays `unknown`; use NetInfo on Android if a feature needs metering.

## AppState as the activity source

Automatic checks should run only while the app is in the foreground. Give Reach the app's state:

```ts
import type { Activity, ObservableValue } from "@priemskiyyy/reach";
import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";

const ACTIVITIES: Record<AppStateStatus, Activity> = {
  active: "foreground",
  background: "background",
  inactive: "background",
  extension: "background",
  unknown: "unknown",
};

export const appActivity: ObservableValue<Activity> = {
  get: () => ACTIVITIES[AppState.currentState],
  subscribe: (listener) => {
    const subscription = AppState.addEventListener("change", listener);

    return () => {
      subscription.remove();
    };
  },
};
```

Pass `activity: appActivity` to the Reach, and a return to the foreground becomes a gap: older endpoint results end, the source is read again, and monitored endpoints with the `foreground` trigger check once. See [monitoring](monitoring.md).

Reach's foreground is eligibility for automatic checks, not a promise that the OS keeps your app running. Background work belongs to a background task library.

## On the web

Both native adapters are unavailable anywhere but iOS and Android. In a React Native for Web build they start with every fact `unsupported`, for the reason `source-unavailable`. Use the browser adapter for the web build if it matters.

## Fetch and abort

Pass the check's `signal` to your client. Some React Native clients keep a request going after abort; Reach still times the check out at its deadline, but the request holds a slot until it settles. See [HTTP endpoints](http.md#abort-in-practice).

## What is verified

The adapters are tested against fakes modeled on each SDK's source, and the Expo example runs on the web against a fixture server. Nothing has run on a device yet. The [verification matrix](verification.md) lists what a device check has to establish.
