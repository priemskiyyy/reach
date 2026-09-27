---
description: "How the Reach core is put together: its owners, how a report and a check move through them, and the tests that guard each rule."
---

# Runtime architecture

Reach keeps a model of network evidence: what a source reported, on what basis, and how long ago. It never turns a missing fact into `false`, and it never reads one kind of evidence as another. This page describes the parts that keep those promises and names the tests that guard them.

## Owners

Every piece of state has one owner. Only `Reach`, `ReachError`, the combinators and the mock and testing entries are exported.

| Owner               | Responsibility                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `Reach`             | The facade. Resolves options once, wires the owners together and publishes the observables.        |
| `NetworkRuntime`    | Leases, the adapter session, the order of reports, generations, refresh, stop and disposal.        |
| `ResourceScope`     | The cleanups one session registered, run once, in reverse, each isolated from the others.          |
| `EndpointRegistry`  | The named endpoints, their scope and activity subscriptions while running, and foreground returns. |
| `EndpointRecord`    | One endpoint: its checks, waiters, deadline, result, expiry and scope key.                         |
| `EndpointMonitor`   | Monitoring demand, triggers, the minimum interval between starts and the polling interval.         |
| `DeadlineScheduler` | Every deadline on one host timer, woken by the earliest.                                           |
| `Diagnostics`       | The versioned snapshot, and events only while someone subscribes.                                  |

State that others read lives in `ValueStore`. Values computed from it, such as conditions and endpoint projections, are `DerivedValue`s. Every change goes through a `Transaction`: all new values are installed first, then listeners are notified, so no listener sees one owner updated and another not.

## The path of a report

1. The adapter calls `emit`, a reserved slot's `emit`, `invalidate` or `reportError`. A call from a session that already closed is counted in diagnostics and dropped.
2. The runtime gives each report a place in the order. A reserved slot holds the place it had when it was reserved, so a slow read never overwrites an event that arrived after it.
3. While the session opens, reports wait. They become evidence only if the runtime adopts that session.
4. `readObservation` turns each field observation into evidence. A field left out of a report is unknown, never its previous value.
5. A report identical in every fact publishes nothing. A report whose connection status or type differs, or a gap, advances the generation.
6. A new generation supersedes endpoint checks that started under the old one before anyone can read the new state.

Tests: T039 to T043 in `runtime.test.ts` for order and adoption, T013 and T016 for identical and partial reports, T046 for errors, T100 in `checks.test.ts` for supersession.

## The path of a check

1. `check()` joins a running check of the same endpoint, or starts one if a slot is free. A full set of running checks refuses instead of queueing.
2. The check's `ProbeContext` carries a signal, the scope key, the network state and a deadline on the monotonic clock.
3. A result is accepted only while the check is current: same generation, same scope key, same session.
4. A result that arrives at or after the deadline is a timeout, even when its timer has not run yet.
5. A throwing check is a probe error. It keeps the previous result and never becomes an unavailable endpoint.
6. An accepted result expires on its own. Freshness pairs the monotonic and wall clocks, so a sleep that paused one still expires it.
7. A check that ignores abort keeps its slot until its own promise settles.

Tests: T067 to T108 in `checks.test.ts`, T080 to T089 in `freshness.test.ts`, T125 to T134 in `scopes.test.ts`.

## Monitoring

Monitoring is demand, not a scheduler of its own. `monitor()` while idle is dormant: nothing opens and nothing is checked. Triggers inside the minimum interval become one start. Without an interval, a monitor never polls. With an activity source, automatic checks wait for the foreground, and a return to the foreground ends older results, refreshes the source and checks only monitored endpoints. A native report of no path skips automatic checks; a browser hint never does.

Tests: T109 to T124 in `monitoring.test.ts`.

## Lifetime

- Constructing a Reach opens nothing, arms no timer and reads no clock (T001).
- An unavailable host never opens the adapter: the runtime runs with every fact `unsupported` and the lease resolves.
- Concurrent owners share one opening, and one owner's release leaves the session to the others (T033, T034).
- A session that opens after its last owner left is never adopted, and its cleanups run at once (T036, T038).
- Stopping and disposing supersede running checks before installing stale facts, so a check never reads as superseded by a network change it never saw.
- Disposal is terminal: it settles every waiter, runs every cleanup even when one throws, and ignores late callbacks (T158, T159).
- Churn leaves no session, timer, check or listener behind (T160 in `diagnostics.test.ts`).

## Adapters

An adapter is a plain object with a `name`, `available()` and `open(context)`. A host without the source, such as a server render, never opens it: the runtime runs with every fact `unsupported` and records `source-unavailable`. An opened source declares its capabilities once per session, and the core copies and freezes them. `testNetworkAdapter` in `@priemskiyyy/reach/testing` runs seven contract checks against any adapter, and every adapter in this repository passes them in its `conformance.test.ts`.

Adapters never import their SDK. Each takes it as an option, and a `*.contracts.ts` file proves the real SDK's types fit the structural ones.
