# Darkroom on Expo

Darkroom as a React Native app. The web examples simulate the phone; this one reads the real one through `@priemskiyyy/reach-netinfo`, and checks your API over the network against the fixture server in `examples/server`, the way a mobile client checks its own backend.

```sh
pnpm build
pnpm dev:server
cp examples/expo/.env.example examples/expo/.env
pnpm --filter example-expo dev
```

The iOS simulator and the web export reach the server at `localhost`. The Android emulator reaches your computer at `10.0.2.2`, so set `EXPO_PUBLIC_API_URL` in `.env` to `http://10.0.2.2:4401`. On a physical device, use your computer's LAN address, such as `http://192.168.1.20:4401`; `localhost` on the phone is the phone.

The fixture server speaks http. An Android Release build blocks cleartext traffic, which the debug manifest alone allows, so it cannot reach the server: use a debug build, or allow cleartext in the Android manifest for the fixture server. A Release build on an emulator passed once `android:usesCleartextTraffic="true"` was added, with `10.0.2.2` as the emulator's alias of your computer. iOS reached `localhost` through `NSAllowsLocalNetworking`.

How it fits together:

- `src/network/reach.ts` declares the one Reach: NetInfo as the source, and the API through `@priemskiyyy/reach-http`, scoped to the signed-in account and monitored on start, network changes, a new account and the return to the foreground. The conditions are the shared Darkroom ones.
- `src/network/readHealth.ts` is the app's own client: real `fetch` with the check's signal, the account in a header, an error status as a rejection, and the body parsed with Zod at the boundary.
- `src/network/appActivity.ts` turns `AppState` into Reach's activity, so the API is checked on its own only while the app is active.
- `index.tsx` starts the Reach once, holds one monitor for the life of the app, and wraps it in `ReachProvider`.
- The cards read `useNetwork`, `useCondition` and `useEndpoint`: the facts with their evidence, the conditions with their reasons, what each backup would decide, and the API's last answer against whether it still counts.
- The Unmetered condition asks for `metered: false` and `constrained: false`. NetInfo reports no data preference on either platform, so `constrained` is unsupported and the condition is Unknown on unmetered Wi-Fi. It is Unmet only when Android reports the connection as metered.

On the web NetInfo is not a native source, so the adapter is unavailable and Reach runs with every fact unsupported for the reason `source-unavailable`, instead of failing. Automatic backup waits, and says why.

## Using Expo Network instead

`@priemskiyyy/reach-expo-network` maps `expo-network` 58, which ships with Expo SDK 58. On that SDK, install `expo-network` and swap the adapter in `src/network/reach.ts`; nothing else changes:

```ts
import { expoNetwork } from "@priemskiyyy/reach-expo-network";
import * as Network from "expo-network";

const adapter = expoNetwork({ sdk: Network, platform: Platform.OS });
```

## Breaking the API

The fixture server keeps its state in memory, so you can change it while the app is open and press Check API to see the result:

```sh
curl -X POST localhost:4401/api/control \
  -H 'content-type: application/json' \
  -d '{"degraded":true}'
```

`offline` and `degraded` take a boolean, and `latency` takes `0`, `400` or `6000` milliseconds. At 6 seconds the check outlives its 3 second timeout, so it fails without an answer, and the server logs the request as aborted when Reach hangs up. A degraded API answers, but not ready, so the check fails its test with an answer received.

`pnpm lint:typescript` typechecks the app, and `pnpm --filter example-expo build` and `build:native` bundle it for web, iOS and Android. No workflow runs it. It was run by hand as Release builds on an Android emulator and an iOS simulator on 2026-10-02, and not on a physical device: [the verification matrix](../../docs/verification.md#run-on-an-android-emulator-and-an-ios-simulator) says what was seen.
