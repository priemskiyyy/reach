---
description: "What is verified for Reach and how: the specification's cases in tests, the adapters against fakes and in Chromium, and the device and browser checks still to run."
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
| Browser adapter     | The example tour takes Chromium offline and back, and the adapter reports each change                         |
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
