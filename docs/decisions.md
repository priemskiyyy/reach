---
description: "Where the implementation departs from the Reach specification, and why."
---

# Decisions

The specification is a private design document, and the `T` numbers in these docs and in test names refer to its cases and are kept for traceability. It describes behavior and a declaration fixture. The behavior is implemented as written. The places below differ in shape or packaging, to match the sibling libraries or to let the types carry what the fixture checked at runtime.

## Types before runtime checks

Options, requirements, endpoint names, hook selections and adapter answers are checked by the types and the `*.contracts.ts` files. There is no `INVALID_OPTIONS` code, and untyped JavaScript that breaks the types may throw: a malformed observation is not turned into a source error, and a browser property is not probed for its type. Runtime checks remain only for what a type cannot say: a duration that is not a positive whole number of milliseconds, a monitoring policy its activity source cannot honor, an endpoint name that was never defined, and a disposed runtime. Values an application provides at runtime, such as a scope, an activity source or a condition evaluator, are still isolated when they throw.

- `all()` and `any()` take at least one condition by signature.
- `reach.endpoint(name)` accepts only the names the endpoints were declared with.
- A requirement object with no keys, an unknown key or a non-Boolean cost requirement fails to compile.
- A hook's `isEqual` takes only the type its selector returns.
- The HTTP endpoint's `test` reads the data its `request` resolves with.
- A field capability is either `{ support: "unsupported" }` or supported with its notifications and bases, so an unsupported fact cannot claim a basis.
- Every adapter declares `available()`, so an adapter that forgets its host fails to compile.

## Naming and shapes

- `ObservableValue` (`get`, `subscribe`) instead of `Readable`, as in every sibling library. A condition is an `ObservableValue<ConditionState>`.
- Error codes are upper snake case (`SOURCE_TIMEOUT`, `PROBE_ERROR`), and only codes something raises exist. Public values are lower case (`native-path`, `source-ambiguous`).
- Durations are milliseconds without a unit suffix: `staleAfter`, `timeout`, `minInterval`, and `timeouts: { open, refresh }` on the runtime.
- `type` instead of `interface`, and no `readonly` in types: published data is frozen at runtime.
- `Reach<TNative, TName extends string = never>` takes `endpoints?: Record<TName, EndpointDefinition>`, so inline endpoint literals keep their names. There is no `createNetworkAdapter()` or `endpoint()` helper: adapters and endpoint definitions are plain typed objects.
- `reach.status` is a union discriminated on `state`: `idle`, `starting`, `running` with `refreshing`, `error` with the error, and `disposed`.
- An endpoint handle's `available` is a stable condition property, not a method.
- Identifiers are plain values: a condition reason is `{ code, field, endpoint }` with the endpoint's name, and observations, attempts and diagnostics carry `check` and `session` numbers.
- Evidence carries no `source`. The adapter's name is in the diagnostic snapshot.

## Adapter contract

- An adapter is `{ name, available, open }`, as in Pulse. `available()` probes the host before each opening. An unavailable host, such as a server render or a native adapter on the web, runs with every fact `unsupported` for the reason `source-unavailable`, all capabilities unsupported and a `source-unavailable` diagnostic, where the specification had the adapter reject with an unsupported-environment error. Either way every condition is `unknown`; this way nothing fails that was never going to work there.
- A field observation is a union: `current` with a value and a basis, or `unknown`, `unsupported` and `error` without a value. A missing fact cannot be read as `false`.
- A read that finishes later takes its place in the order with `context.reserve()`, instead of numbering its own reports. An event reported after the reservation wins over the read.
- A refresh receives `{ signal, emit }` and reports what it read. The core decides whether the refresh `updated`, left the state `unchanged`, was `superseded` or is `unsupported`.
- Capabilities are declared once per session, as one record per fact. The core copies and freezes them. There is no per-observation capability update and no `refresh` flag: a session without `refresh` is one that cannot refresh.
- `context.onDispose` is the session's one cleanup channel; the context has no abort signal of its own. `context.invalidate()` marks a gap and needs no reason.

## Left out

Parts of the specification that no source, adapter or binding used, removed rather than kept for a later need:

- Route keys on observations, and the `ownership`, `routeIdentity` and `upstreamActivity` capability fields. A generation starts on a change of connection status or type, or on `invalidate()`. An adapter that learns of an invisible route change reports it as a gap.
- `verifiedAt` on evidence. No source says when it verified a fact; one that verifies says so in its basis, such as `native-validation`.
- `network`, `deadline` and `isCurrent()` on a check's context. A check receives `{ signal, scope }`: its signal aborts at the deadline and whenever the check stops mattering, so `signal.aborted` is the guard between steps, and the network is one `reach.state.get()` away.
- `createObservation` in the mock entry; the mock network's `emit` takes partial input.

## Packages

- The HTTP helper is `@priemskiyyy/reach-http`, an adapter package like `@priemskiyyy/flare-http`, not a `/http` subpath of the core. Its `request` is the application's own client and resolves with parsed data. The address, method, headers, credentials, redirects, caching and parsing belong to that client, so the stock fetch options of the specification are not repeated. A rejected request is a failure whose response is `unknown`, because a client rejects for a refused connection and for an error status alike. The data type only types the test; endpoint state never holds the data.
- Three cases of the specification's stock fetch helper follow from that choice. An opaque response (T072) and a missing `fetch` (T075) are the client's to handle. A preparation that throws inside `request` (T074) is a rejected request, so a failure, because nothing tells it apart from a network error. What can fail before any request is sent, such as a missing token, belongs in the endpoint's `scope`: a `null` key refuses the check and leaves the endpoint unknown.
- The native adapters take the SDK and `Platform.OS` as options instead of importing them, so no package imports `react-native`, NetInfo or Expo. Anywhere but iOS and Android they are unavailable; the browser adapter is the web integration.
- The HTTP `request` receives the check's own context, `{ signal, scope }`, rather than a type of its own.
- The Expo Network mapping was read from the iOS and Android sources of `expo-network` 58.0.1, which is the oldest version the peer range admits.

## Endpoint scope

A scope source is subscribed while the runtime runs, and every read and check reconciles the scope again. A scope change supersedes a check under the old key at once, whether or not anything observes the endpoint.

## Bindings

- `useNetwork()` without arguments reads the provider's Reach. `useReach()` returns that Reach, so a selection through the provider is `useNetwork(useReach(), selector)`.
- On the server and in the hydrating render, an endpoint reads as unscoped and never checked: a server cannot know the client's scope.
- The React binding supports React 19.2 and later, as the sibling bindings do.
- `toOnlineEventListener()` returns the setup function Query's online manager installs. It imports nothing from Query.

## Verified with fakes, and by hand once

The adapters are tested against fakes modeled on the SDK sources and against the real SDK types. On 2026-10-02 the Expo example also ran by hand, as Release builds, on an Android emulator and an iOS simulator, over NetInfo and the HTTP endpoint; [the verification matrix](verification.md#run-on-an-android-emulator-and-an-ios-simulator) says what was seen. No physical device has been used. The documentation claims no more than each of these items says:

- Real NetInfo and Expo Network reports on a physical iOS or Android device. NetInfo's were seen on an emulator and a simulator, and Expo Network's were not seen at all.
- Native start, stop and start again for Expo Network, and for NetInfo on a physical device. Five lease cycles of NetInfo ran on an emulator and a simulator, and whether events still arrive after a restart on iOS was not checked.
- Real browser `pagehide`, `freeze` and Network Information events. Chromium's `offline` and `online` pass in a local Playwright check that no workflow runs: the example tour, `pnpm test:examples`, takes Chromium offline and back, and the browser adapter reports each change.
- React Native HTTP clients other than `fetch` honoring abort through the HTTP endpoint. React Native's `fetch` aborted a request at its deadline on an emulator and a simulator, and Node's own `fetch` is verified: the HTTP tests abandon a real loopback connection on a timeout and on a network change.

The packed packages are verified: `pnpm verify:packages` installs every tarball into a consumer without any native SDK, React or Query, imports each entry in Node without browser globals, and typechecks it.
