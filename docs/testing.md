---
description: "Testing an application that uses Reach: a mock network you drive, a mock endpoint you answer, and a clock you advance."
---

# Application testing

`@priemskiyyy/reach/mock` gives you a network you drive, an endpoint you answer, and a clock you advance, so every test is deterministic and needs no device and no network.

```ts
import { Reach } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";

const mock = createMockNetwork({
  initial: {
    connection: {
      status: observed("connected", "native-path"),
      type: observed("wifi", "native-path"),
    },
    cost: { metered: observed(false, "native-metering") },
  },
});

const probe = createMockEndpoint({ staleAfter: 30_000 });
const clock = createTestClock();

const network = new Reach({
  adapter: mock.adapter,
  clock,
  endpoints: { api: probe.definition },
});

await network.start().ready;
```

## The mock network

`createMockNetwork(options)` returns an `adapter` and the controls of its source:

- `emit(input)` reports an observation. A fact you leave out is unknown, as with a real adapter. `observed(value, basis?)` builds a current fact. The report changes the source: the open session hears it, and a later session opens on it.
- `invalidate()` reports a gap, `reportError(error)` a source error.
- `reserve()` starts a slower read that takes its place in the order now and reports later.
- With `open: "held"`, opening waits for `resolveOpen()` or `rejectOpen(error)`; `failNextOpen(error)` fails the next one.
- With `refresh: "held"`, a refresh waits for `resolveRefresh(input)` or `rejectRefresh(error)`; `refresh: "none"` makes the source unable to refresh.
- `available: false` makes the host unavailable, as on a server.
- `stats()` counts opens, cleanups, active sessions and refreshes, so a test can prove nothing leaked.

## The mock endpoint

`createMockEndpoint(options)` returns a `definition` for the Reach, and answers the oldest pending check with `pass()`, `fail(reason?)` or `inconclusive(reason?)`. `throwNext(error)` makes the next check throw, `pending()` counts unanswered checks, and `calls` holds each check's context, so a test can read its `signal` and `scope`.

```ts
import { Reach } from "@priemskiyyy/reach";
import { createMockEndpoint, createMockNetwork } from "@priemskiyyy/reach/mock";
import { createTestClock } from "@priemskiyyy/reach/mock";

const probe = createMockEndpoint({ staleAfter: 30_000 });
const clock = createTestClock();

const network = new Reach({
  adapter: createMockNetwork().adapter,
  clock,
  endpoints: { api: probe.definition },
});

await network.start().ready;

const api = network.endpoint("api");
const checking = api.check();

probe.pass();

const { state } = await checking;

console.info(state.status, probe.calls[0]?.context.signal.aborted);

clock.advance(30_000);

console.info(api.state.get().freshness);
```

## The test clock

`createTestClock()` drives every timer and time source Reach reads. `advance(ms)` moves both clocks and runs what falls due, `skip(ms)` moves both clocks without running a timer, as a suspended runtime does, `setNow(ms)` moves the wall clock alone, `runDue()` runs timers already due, and `pendingTimers()` counts what is armed.

## Testing your conditions

Test the decisions your application makes, not Reach:

```ts
import { all, Reach } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  observed,
} from "@priemskiyyy/reach/mock";

const mock = createMockNetwork();
const probe = createMockEndpoint({ staleAfter: 30_000 });

const network = new Reach({
  adapter: mock.adapter,
  endpoints: { api: probe.definition },
});

await network.start().ready;

const automatic = all(
  network.endpoint("api").available,
  network.condition({ metered: false }),
);

mock.emit({ cost: { metered: observed(true, "native-metering") } });

console.info(automatic.get());
```

Cover the unknown case for every feature: `mock.emit({})` makes every fact unknown, and a network with `capabilities` marking a fact unsupported reproduces a platform that never reports it.

## Components

With React, render your components inside `ReachProvider` over a Reach built on the mock network, and drive it from the test. The hooks read through `useSyncExternalStore`, so a change you emit shows in the next render.
