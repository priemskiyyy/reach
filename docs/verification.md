---
description: "What is verified for Reach and how: the specification's cases in tests, the adapters against fakes and a local Chromium check, and the device and browser checks still to run."
---

# Verification matrix

Reach claims only what has been verified, and says how. Most of it is verified in process; some of it needs a device or a real browser, and is listed here until someone runs it.

## Verified in the repository

| Area                | How                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Core runtime        | Unit tests named after the specification's cases, on a test clock, with the mock network and mock endpoint    |
| Changing world      | A seeded fuzz of a fake operating system that changes between steps, judged by what it reported: not a device |
| Types and contracts | `*.contracts.ts` files prove what must fail to compile, such as an empty requirement or an undefined endpoint |
| Adapters            | Fakes modeled on each SDK's source, the shared conformance suite, and contracts against each SDK's real types |
| HTTP abort          | Node's `fetch` over a loopback server abandons the connection on a timeout and on a network change            |
| Browser adapter     | A local Playwright check, not run in CI: the tour takes Chromium offline and back                             |
| React               | React Testing Library in jsdom, and a hydrated server render                                                  |
| Packed packages     | Every tarball installs into a consumer without native SDKs, imports in Node and typechecks                    |
| Documentation       | Every TypeScript snippet here typechecks against the built packages                                           |

## Not yet verified

- Native start, stop and start again for NetInfo and Expo Network, and their real reports on iOS and Android.
- Real browser `pagehide`, `freeze` and Network Information events.
- React Native fetch clients honoring abort.

## Scenarios that need a device or a browser

The specification's cases T135 to T144 cannot be proved in process. Where they stand:

| Case | Scenario                                           | Status                                                                                     |
| ---- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| T135 | A captive portal answers with a redirect or HTML   | Simulated in the example: the client fails to parse, the check fails, nothing says portal  |
| T136 | Wi-Fi is associated but the internet fails         | Simulated in the example: connected, internet unknown, the endpoint unavailable            |
| T137 | Airplane mode with Wi-Fi turned back on            | Needs a device                                                                             |
| T138 | A private API reachable only through a VPN         | Needs a device; a manual check never requires public internet evidence                     |
| T139 | A VPN toggles while the type stays Wi-Fi           | Needs a device; undetectable switches are a documented limit                               |
| T140 | A same-type Wi-Fi switch the SDK does not show     | Needs a device; simulated in the example through `invalidate()`                            |
| T141 | A service worker answers the health request        | Needs a browser; excluding the route is documented, `no-store` is not claimed to bypass it |
| T142 | CORS or CSP blocks the endpoint                    | Needs a browser; a blocked request is a failed check, never a server outage                |
| T143 | A native HTTP option differs from browser behavior | Needs a device                                                                             |
| T144 | A native source stopped and started repeatedly     | Needs a device                                                                             |

## Run on an Android emulator and an iOS simulator

Recorded on 2026-10-02, by one person, by hand. The Expo example ran as Release builds on one Android emulator and one iOS simulator, against the local fixture server. It is evidence that `@priemskiyyy/reach-netinfo` and `@priemskiyyy/reach-http` ran there, and nothing more. No physical device was used, and nothing below says anything about one.

| Part     | Android                                                                    | iOS                                                    |
| -------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Device   | Pixel_10 emulator, API 36 (android-36.1, google_apis_playstore, arm64)     | iPhone 17e simulator, iOS 26.5, Xcode 26.6             |
| App      | the Expo example (`examples/expo`), a Release build, Expo SDK 57.0.25      | the same                                               |
| Runtime  | React Native 0.86.3, Hermes, new architecture                              | the same                                               |
| Source   | `@priemskiyyy/reach-netinfo` over `@react-native-community/netinfo` 12.0.1 | the same                                               |
| Endpoint | `@priemskiyyy/reach-http` against the fixture server in `examples/server`  | the same                                               |
| Network  | airplane mode, Wi-Fi and mobile data toggled on the emulator               | shared the Mac's network, and no change was made to it |

### Android emulator

| Step                                                | What was seen                                                                                                                                                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch                                              | Connected, Wi-Fi, on the native path. Internet Online, as a provider report. Metered No, on the native path. Transports and expensive unsupported. It matched `dumpsys connectivity`.                                            |
| Airplane mode on                                    | Disconnected, type None, internet Offline on the native path, stamped in the same second. Metered became Unknown, not No. The API endpoint went Unknown and Stale and no automatic check ran. A manual `check()` ran and failed. |
| Airplane mode off                                   | Disconnected at 1 s. Connected, with internet Online, at 6 s after the command. The endpoint check passed within 9 s.                                                                                                            |
| Wi-Fi off, mobile data on                           | Cellular and metered Yes, within 1 s. Wi-Fi came back about 6 s after it was enabled. Turning data off with Wi-Fi on changed nothing.                                                                                            |
| Wi-Fi enabled in airplane mode                      | It stayed up, which Android allows, and a later airplane mode toggle did not drop it.                                                                                                                                            |
| Wi-Fi with an unreachable Private DNS               | Connection Connected and internet Unknown, not Offline. The Online condition was Unknown. The endpoint, reached by IP, stayed Available. On restore the type showed Cellular briefly, then Wi-Fi, and Online was Met in 8 s.     |
| Metered Yes on Wi-Fi                                | Seen after reconnecting with `cmd wifi connect-network -m`. A change of metering alone was not tested.                                                                                                                           |
| Backgrounded, Wi-Fi off then on                     | No check ran in the background. One check ran within 1 s of the return to the foreground, with nothing touched, and the facts refreshed.                                                                                         |
| Endpoint failing, server restored in the background | After the return, the check passed within 1 s.                                                                                                                                                                                   |
| Check in flight, Wi-Fi cycled in the background     | The check was superseded and never committed. One check passed within 1 s after the return.                                                                                                                                      |
| Failure kinds                                       | A 6 s response failed with "no answer within 3 s", and the server saw the abort at about 3014 ms. A degraded API gave "answered, but not ready". Signed out gave Unknown and Never checked.                                      |
| Force-stop and relaunch                             | The initial read was correct, online and offline.                                                                                                                                                                                |
| Five lease cycles                                   | From a local harness: each returned to running, and a later Wi-Fi toggle reached the UI within 1 s.                                                                                                                              |

Logcat showed no fatal exception.

### iOS simulator

No network change was made, because a simulator shares the Mac's network.

| Step                        | What was seen                                                                                                                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch                      | Connected, Wi-Fi, on the native path. Internet Online, as a provider report. Transports, metered, expensive, Low Data Mode and data saver were unsupported or Unknown, as [the adapters page](adapters.md#what-each-one-can-tell) says. |
| Foreground, then background | In the foreground, 2 requests in 36 s at a 15 s interval. In the background for 40 s, none. Back in the foreground, 1 request within 2.5 s.                                                                                             |
| Request timeout             | The request aborted at about 3004 ms, and the server saw the abort.                                                                                                                                                                     |
| Five lease cycles           | Each returned to running.                                                                                                                                                                                                               |

### Observed in the example

- An Android Release build could not reach the example's http fixture server, because cleartext traffic is allowed only in the debug manifest. The same setup passed once `android:usesCleartextTraffic="true"` was added. iOS reached it through `NSAllowsLocalNetworking`. The [example's README](https://github.com/priemskiyyy/reach/tree/main/examples/expo#readme) says how to run it.
- The example worded a failed check that came from an HTTP error status, a 503, as "the request failed before any answer arrived", although the server had answered. The example's wording now covers an error status.
- The example's Unmetered condition asks for `constrained: false`, which NetInfo reports on neither platform, so it stayed Unknown on unmetered Wi-Fi. That follows from the adapter's capabilities and is now noted in the example's README.

### Observed and not explained

- A cold start with no network showed "Check #1 failed ... network changed since". The example calls `monitor()` right after `start()`, as [monitoring](monitoring.md) does, so a check can start before the first native report. That is a reading of the code, not something the run showed, and the example was not changed or run again.
- On iOS the monitor's generation advanced on the return to the foreground, and the facts' timestamps did not move. A report identical in every fact publishes nothing, and `Evidence` documents that a repeated report does not move `receivedAt`. Nothing more is known.

### Not run

Physical devices, real cellular, captive portals, VPN, OEM battery managers, network transitions on iOS, Low Data Mode, the browser adapter on a device, and the Solid, Vue and Svelte bindings on a device. Whether events still arrive after a restart on iOS was not checked.

`@priemskiyyy/reach-expo-network` was not run. The example is on Expo SDK 57, and the adapter's peer is `expo-network` 58.0.1 or later. On 2026-10-02, `npm view expo-network dist-tags` showed `latest` at 57.0.2 and 58.x on the `next` tag only, at 58.0.3.

One emulator, one simulator and one build do not make a timing guarantee. A time in the tables is what one run showed.

## The native checklist

A device verification records the OS and its version, the device model, the provider and its release, and the build configuration, then the result of each of these:

- Wi-Fi without internet.
- Cellular fallback while Wi-Fi fails.
- Airplane mode, and airplane mode with Wi-Fi turned back on.
- Recovery on returning to the foreground.
- Attaching and detaching the listener repeatedly, and a Reach started, released and started again.
- A switch between two Wi-Fi networks of the same type.
- On Android, a change of metering alone. On iOS, whether expense is reported at all. Each is marked supported, partially observable, unsupported or unverified.

## The browser checklist

- A browser without the Network Information API, and one with it.
- A page controlled by a service worker.
- A health request denied by CORS.
- Developer tools' offline mode, and a real disconnection where practical. The first is one environment, not a substitute for real routing.
- Server rendering and hydration.
- Leaving the page and coming back through the back-forward cache.

No test contacts a public third-party endpoint: HTTP fixtures run locally. Anything involving a real captive portal or paid mobile data is for a maintainer to run by hand.
