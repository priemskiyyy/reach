# Changelog

## @priemskiyyy/reach 0.1.0 - 2026-10-02

- First release. `Reach` keeps one model of network evidence over one adapter: connection status, type and transports, internet status, cost and data preferences, each with the basis it rests on and when it was received.
- A missing fact is unknown, never `false`. Evidence is never upgraded: a browser hint is not internet, a provider report is not verification, and an ambiguous negative is not offline.
- `reach.condition()` derives a three-valued condition, `met`, `unmet` or `unknown` with its reasons, from requirements such as `{ internet: "online", metered: false }`. `all`, `any`, `not` and `createCondition` compose conditions without glitches.
- Leases: `start()` returns a lease, concurrent owners share one session, and the last release stops it. `dispose()` is terminal and settles everything pending.
- An adapter is `{ name, available, open }`. A host without the source, such as a server render, runs with every fact `unsupported` for the reason `source-unavailable` instead of failing.
- Reports keep their order: a reserved read never overwrites an event that came after it, and a change of connection status or type, or a gap, starts a new generation.
- Named endpoints with checks that are joined, bounded, timed out on the monotonic clock, superseded by network and scope changes, and expired on their own. A check receives `{ signal, scope }`. `monitor()` adds demand with triggers, a minimum interval, an optional interval with jitter, and foreground gating from an activity source.
- Passive diagnostics: a snapshot that keeps its identity while nothing changed, and events that cost nothing while nobody subscribes. Neither carries a scope key.
- `createMockNetwork`, `createMockEndpoint`, `createTestClock` and `observed` under `./mock`, and the `testNetworkAdapter` conformance suite under `./testing`.
- Errors are `ReachError`s with a `code`. Only misconfiguration and use after disposal throw.

## @priemskiyyy/reach-browser 0.1.0 - 2026-10-02

- First release. `browser()` reads `navigator.onLine` as a connection hint, and the Network Information API's type and data saver where each exists. Without a window it is unavailable.
- Hiding, freezing and restoring the page is an observation gap, and the page is read afresh when it returns.
- Requires `@priemskiyyy/reach` 0.1.

## @priemskiyyy/reach-netinfo 0.1.0 - 2026-10-02

- First release. `netInfo({ sdk, platform })` maps React Native NetInfo on iOS and Android conservatively: false reachability while connected stays unknown, only an explicit `none` is offline, and metering is Android's only.
- `internet: "ignore"` leaves NetInfo's reachability out of Reach, without claiming NetInfo stopped its own requests.
- NetInfo is borrowed: never configured, and only the adapter's own listener is removed. Anywhere but iOS and Android the adapter is unavailable.
- Requires `@priemskiyyy/reach` 0.1 and `@react-native-community/netinfo` 12.0.1.

## @priemskiyyy/reach-expo-network 0.1.0 - 2026-10-02

- First release. `expoNetwork({ sdk, platform })` maps `expo-network` per platform: a live iOS no-path event is offline, a negative iOS read stays unknown because a timed-out read answers the same, and Android's validated network is online.
- No cost field is reported, so a metering condition stays unknown. Anywhere but iOS and Android the adapter is unavailable.
- Requires `@priemskiyyy/reach` 0.1 and `expo-network` 58.0.1.

## @priemskiyyy/reach-http 0.1.0 - 2026-10-02

- First release. `http({ request, test, staleAfter })` defines an endpoint checked through the application's own client. The request receives the check's `{ signal, scope }`, resolves with parsed data, and `test` reads it with its type.
- A rejected request fails without claiming a response arrived. A throwing test is a probe error, never an unavailable endpoint. The deadline covers the test.
- Requires `@priemskiyyy/reach` 0.1.

## @priemskiyyy/reach-react 0.1.0 - 2026-10-02

- First release. `ReachProvider`, `useReach`, `useNetwork`, `useCondition` and `useEndpoint`, with inferred selectors and typed equality.
- The hooks observe only. The provider holds a runtime lease only with `start`, and never disposes the Reach.
- The server and the hydrating render read deterministic unknown snapshots.
- Requires `@priemskiyyy/reach` 0.1 and React 19.2.

## @priemskiyyy/reach-solid 0.1.0 - 2026-10-02

- First release. `ReachProvider`, `useReach`, `useNetwork`, `useCondition` and `useEndpoint` as accessors, with inferred selectors and typed equality.
- The primitives observe only. The provider holds a runtime lease only with `start`, and never disposes the Reach.
- The server and the render before mount read deterministic unknown snapshots.
- Requires `@priemskiyyy/reach` 0.1 and Solid 1.9.15.

## @priemskiyyy/reach-vue 0.1.0 - 2026-10-02

- First release. `ReachProvider`, `useReach`, `useNetwork`, `useCondition` and `useEndpoint` as read-only computed refs, with inferred selectors and typed equality.
- The composables observe only. The provider holds a runtime lease only with `start`, and never disposes the Reach.
- The server and the render before mount read deterministic unknown snapshots.
- Requires `@priemskiyyy/reach` 0.1 and Vue 3.5.42.

## @priemskiyyy/reach-svelte 0.1.0 - 2026-10-02

- First release. `ReachProvider`, `useReach`, `useNetwork`, `useCondition` and `useEndpoint`, read through `current`, with inferred selectors and typed equality.
- The utilities observe only. The provider holds a runtime lease only with `start`, and never disposes the Reach.
- The server and the render before mount read deterministic unknown snapshots.
- Ships its sources for the application's Svelte compiler. Requires `@priemskiyyy/reach` 0.1 and Svelte 5.57.

## @priemskiyyy/reach-tanstack-query 0.1.0 - 2026-10-02

- First release. `toOnlineEventListener(condition, { unknown })` turns a condition into the setup function TanStack Query's online manager installs, with `online`, `offline` or `preserve` for unknown.
- It publishes each Boolean once, subscribes before its first read, and publishes nothing after its cleanup.
- Requires `@priemskiyyy/reach` 0.1.
