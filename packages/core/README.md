# @priemskiyyy/reach

An application-owned model of network evidence. One `Reach` holds what your network source reported, on what basis and how long ago, derives three-valued conditions from it, and coordinates named endpoint checks.

It never turns a missing fact into `false`. A browser's `onLine` is a hint, not internet. A provider's reachability is its report, not verification. An ambiguous negative is unknown, not offline. And one endpoint's failure is that endpoint's, not the network's.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-browser
```

Pick the adapter for your platform: [browser](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/browser), [NetInfo](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/netinfo) or [Expo Network](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/expo-network). Add [HTTP](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/http) for endpoint checks, [React](https://github.com/priemskiyyy/reach/tree/main/packages/react) for hooks and [TanStack Query](https://github.com/priemskiyyy/reach/tree/main/packages/tanstack-query) for Query's online manager.

## Create a Reach

```ts
import { all, Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

export const network = new Reach({
  adapter: browser(),
  endpoints: {
    api: http({
      request: ({ signal }) => client.health.get({ signal }),
      test: ({ status }) => status === "ready",
      staleAfter: 30_000,
    }),
  },
});

export const internet = network.condition({ internet: "online" });
export const unmetered = network.condition({ metered: false });
export const automaticUpload = all(
  network.endpoint("api").available,
  unmetered,
);

const lease = network.start();

await lease.ready;
```

Constructing a Reach opens nothing, arms no timer and reads no clock. `start()` returns a lease; the source opens on the first one and stops when the last is released.

## Network state

`network.state` is an observable snapshot, frozen and replaced on every meaningful change:

```ts
const { connection, internet, cost, preferences, evidence } =
  network.state.get();

if (evidence["internet.status"].status === "current") {
  console.info(internet.status, evidence["internet.status"].basis);
}

console.info(
  connection.status,
  connection.type,
  cost.metered,
  preferences.saveData,
);
```

| Fact                      | Values                                                    |
| ------------------------- | --------------------------------------------------------- |
| `connection.status`       | `connected`, `disconnected` or `unknown`                  |
| `connection.type`         | a transport, `none`, `mixed` or `unknown`                 |
| `connection.transports`   | every link at once, or `null` when the set is not known   |
| `internet.status`         | `online`, `offline` or `unknown`                          |
| `cost.metered`            | `true`, `false` or `null`                                 |
| `cost.expensive`          | `true`, `false` or `null`                                 |
| `preferences.constrained` | a user's low data mode, `true`, `false` or `null`         |
| `preferences.saveData`    | a user's data saver preference, `true`, `false` or `null` |

Each fact's `evidence` says whether it is `current`, `unknown`, `unsupported`, `stale` or in `error`, its `basis`, such as `browser-hint`, `provider-report`, `native-path` or `native-validation`, and when it was received. The bases are different kinds of evidence, not ranks on one confidence scale.

`network.capabilities` holds what the opened source can observe, and `network.native` the provider's own object.

## Conditions

A condition is `met`, `unmet` or `unknown`, with the reasons for it:

```ts
const onWifi = network.condition({ connection: "connected", type: "wifi" });

onWifi.subscribe(() => {
  const { status, reasons } = onWifi.get();

  console.info(status, reasons);
});
```

A requirement names at least one fact. An unsupported or unknown fact makes the condition `unknown`, never `unmet`. `all`, `any` and `not` compose conditions with three-valued logic, and `createCondition` derives one from any observable values:

```ts
import { createCondition } from "@priemskiyyy/reach";

const allowed = createCondition({
  sources: { network: network.state, settings },
  evaluate: ({ network, settings }) => {
    if (settings.allowAnyNetwork) {
      return "met";
    }

    if (network.cost.metered === null) {
      return "unknown";
    }

    return network.cost.metered ? "unmet" : "met";
  },
});
```

Conditions are derived on read and never glitch: a listener sees every condition consistent with the same state.

## Endpoints

An endpoint is a named check: a function that answers `pass`, `fail` or `inconclusive`. [`http()`](https://github.com/priemskiyyy/reach/tree/main/packages/adapters/http) builds one over your own HTTP client.

```ts
const api = network.endpoint("api");

const { observation, state } = await api.check();

console.info(observation.verdict, state.status, state.freshness);
```

- `check()` joins a check already running, and each caller can cancel only its own wait with a `signal`.
- A check that outlives its `timeout`, 5,000 by default, fails with a `timeout` reason, even when its answer arrives later.
- A connection change, a scope change, a stop or a disposal supersedes a running check. Its result is never committed.
- A result expires after `staleAfter`, on its own, and a sleep that paused one clock still expires it.
- `maxOutstandingChecks`, 4 by default, bounds checks that run physically at once, including those that ignore abort.

`api.state` holds `status`, `freshness`, `checking`, `scope`, the last observation and attempt, and the last error. `api.available` is a stable condition, `met` while a current check passed.

### Monitoring

```ts
const stopMonitoring = network.endpoint("api").monitor();
```

A monitor is demand: while at least one exists and the runtime runs, the endpoint's `monitoring` policy starts checks `on` its triggers, `start`, `network-change`, `foreground` and `scope-change`, never closer than `minInterval`, and every `interval` when one is set. With an `activity` source, automatic checks wait for the foreground. A native report of no path skips automatic checks; a manual `check()` is always the caller's decision.

### Scopes

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

const network = new Reach({
  adapter: browser(),
  endpoints: {
    account: http({
      request: ({ signal, scope }) =>
        client.account.health({ account: scope, signal }),
      staleAfter: 60_000,
      scope: session.account,
    }),
  },
});
```

A scoped endpoint checks only while its scope has a key. Changing the key ends the old key's check and history, so one account's result never speaks for another.

## Refresh and lifetime

- `network.refresh()` asks the source to read again, and resolves with `updated`, `unchanged`, `superseded` or `unsupported`.
- `network.status` is `idle`, `starting`, `running`, `error` or `disposed`.
- `network.dispose()` is terminal: it settles every pending operation, runs every cleanup and ignores late callbacks.

## Diagnostics

`network.diagnostics` is a snapshot of who holds what, which keeps its identity while nothing changed: the runtime, the session, leases, checks and endpoints, with counters. Events flow only while someone subscribes, and never carry a scope key.

## Testing

```ts
import { Reach } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";

const mock = createMockNetwork({
  initial: { internet: { status: observed("online", "native-validation") } },
});

const probe = createMockEndpoint({ staleAfter: 30_000 });
const clock = createTestClock();

const network = new Reach({
  adapter: mock.adapter,
  clock,
  endpoints: { api: probe.definition },
});

await network.start().ready;

const checking = network.endpoint("api").check();

probe.pass();
await checking;

mock.emit({ internet: { status: observed("offline", "native-path") } });
clock.advance(30_000);
```

## Writing an adapter

An adapter is a plain object with a `name`, `available()` and `open(context)`. `available()` says whether this host has the source at all; where it answers `false`, such as in a server render, the runtime still starts, with every fact `unsupported` for the reason `source-unavailable`. `open` subscribes to the source, reports complete observations with `context.emit`, reserves a place for a slower read with `context.reserve()`, marks a gap in what it observed with `context.invalidate()`, registers cleanups with `context.onDispose`, and returns the session's `native` object, its `capabilities` and an optional `refresh`. Run `testNetworkAdapter` from `@priemskiyyy/reach/testing` against it in your tests.

## Errors

Reach's errors are `ReachError`s with a `code`, such as `SOURCE_ERROR`, `SOURCE_TIMEOUT`, `PROBE_ERROR`, `SUPERSEDED` or `CAPACITY_EXHAUSTED`. Only misconfiguration and use after disposal throw synchronously.

## License

MIT
