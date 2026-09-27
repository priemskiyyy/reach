---
description: "Where the implementation departs from the Reach specification, and why."
---

# Decisions

The specification describes behavior and a declaration fixture. The behavior is implemented as written. The places below differ in shape or packaging, to match the sibling libraries or to let the types carry what the fixture checked at runtime.

## Types before runtime checks

Options, requirements, endpoint names, hook selections and adapter answers are checked by the types and the `*.contracts.ts` files. There is no `INVALID_OPTIONS` code, and untyped JavaScript that breaks the types may throw. Runtime checks remain only for what a type cannot say: a duration that is not a positive whole number of milliseconds, an endpoint name that was never defined, and a disposed runtime.

- `all()` and `any()` take at least one condition by signature.
- `reach.endpoint(name)` accepts only the names the endpoints were declared with.
- A requirement object with no keys, an unknown key or a non-Boolean cost requirement fails to compile.
- A hook's `isEqual` takes only the type its selector returns.
- The HTTP endpoint's `test` reads the data its `request` resolves with.

## Naming and shapes

- `ObservableValue` (`get`, `subscribe`) instead of `Readable`, as in every sibling library. A condition is an `ObservableValue<ConditionState>`.
- Error codes are upper snake case (`SOURCE_TIMEOUT`, `PROBE_ERROR`). Public values are lower case (`native-path`, `source-ambiguous`).
- Durations are milliseconds without a unit suffix: `staleAfter`, `timeout`, `minInterval`, and `timeouts: { open, refresh }` on the runtime.
- `type` instead of `interface`, and no `readonly` in types: published data is frozen at runtime.
- `Reach<TNative, TName extends string = never>` takes `endpoints?: Record<TName, EndpointDefinition>`, so inline endpoint literals keep their names. There is no `createNetworkAdapter()` or `endpoint()` helper: adapters and endpoint definitions are plain typed objects.
- `reach.status` is a union discriminated on `state`: `idle`, `starting`, `running` with `refreshing`, `error` with the error, and `disposed`.
- An endpoint handle's `available` is a stable condition property, not a method.
- A condition reason is `{ code, field, endpoint: { name } | null }`.
- Evidence carries no `source`. The adapter's name is in the diagnostic snapshot.

## Adapter contract

- A field observation is a union: `current` with a value and a basis, or `unknown`, `unsupported` and `error` without a value. A missing fact cannot be read as `false`.
- A read that finishes later takes its place in the order with `context.reserve()`, instead of numbering its own reports. An event reported after the reservation wins over the read.
- A refresh receives `{ signal, emit }` and reports what it read. The core decides whether the refresh `updated`, left the state `unchanged`, was `superseded` or is `unsupported`.
- Capabilities are declared once per session. The core copies and freezes them. There is no per-observation capability update and no `refresh` flag: a session without `refresh` is one that cannot refresh.

## Packages

- The HTTP helper is `@priemskiyyy/reach-http`, an adapter package like `@priemskiyyy/flare-http`, not a `/http` subpath of the core. Its `request` is the application's own client and resolves with parsed data. The address, method, headers, credentials, redirects, caching and parsing belong to that client, so the stock fetch options of the specification are not repeated. A rejected request is a failure whose response is `unknown`, because a client rejects for a refused connection and for an error status alike. The data type only types the test; endpoint state never holds the data.
- The native adapters take the SDK and `Platform.OS` as options instead of importing them, so no package imports `react-native`, NetInfo or Expo. On the web they refuse to open with `UNSUPPORTED_ENVIRONMENT`; the browser adapter is the web integration.
- The Expo Network mapping was read from the iOS and Android sources of `expo-network` 58.0.1, which is the oldest version the peer range admits.

## Endpoint scope

A scope source is subscribed while the runtime runs, and every read and check reconciles the scope again. A scope change supersedes a check under the old key at once, whether or not anything observes the endpoint.

## Bindings

- `useNetwork()` without arguments reads the provider's Reach. `useReach()` returns that Reach, so a selection through the provider is `useNetwork(useReach(), selector)`.
- On the server and in the hydrating render, an endpoint reads as unscoped and never checked: a server cannot know the client's scope.
- The React binding supports React 19.2 and later, as the sibling bindings do.
- `toOnlineEventListener()` returns the setup function Query's online manager installs. It imports nothing from Query.

## Verified with fakes only

The adapters are tested against fakes modeled on the SDK sources and against the real SDK types. None of the following has been run on a device or in a browser yet, and the documentation claims no more than that:

- Native start, stop and start again for NetInfo and Expo Network.
- Real NetInfo and Expo Network reports on iOS and Android.
- Real browser `online`, `offline`, `pagehide`, `freeze` and Network Information events.
- React Native fetch clients honoring abort through the HTTP endpoint.
- Installing the packed packages into an independent consumer.
