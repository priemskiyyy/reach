---
description: "How the Reach core is put together: its owners, how a report and a check move through them, and the tests that guard each rule."
---

# Runtime architecture

Reach keeps a model of network evidence: what a source reported, on what basis, and how long ago. It never turns a missing fact into `false`, and it never reads one kind of evidence as another. This page describes the parts that keep those promises and names the tests that guard them. A `T` number is a case in the project's private specification, kept for traceability.

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
| `DeadlineScheduler` | Every endpoint deadline on one host timer, woken by the earliest.                                  |
| `Diagnostics`       | The snapshot, read as things are and kept while equal, and events only while someone subscribes.   |

State that others read lives in `ValueStore`. Values computed from it, such as conditions and endpoint projections, are `DerivedValue`s. Every change goes through a `Transaction`: all new values are installed first, then listeners are notified, so no listener sees one owner updated and another not. A step whose own listeners may call back, such as aborting a superseded check, runs after every listener, and a value a nested transaction already announced is not announced again.

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
2. The check receives `{ signal, scope }`. Its deadline is kept on the monotonic clock, and the signal aborts at the deadline and whenever the check stops mattering.
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

## Invariant ledger

The specification's invariants, and the tests in this repository that prove each one. A test is named after the specification cases it covers.

| Invariant | Rule                                                                         | Tests                                          |
| --------- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| I01       | Unknown never silently becomes false, offline, cheap, or permitted.          | T003 to T012, T024 to T027, T056, T059 to T061 |
| I02       | Capabilities report actual source semantics and notification limitations.    | T017 to T032                                   |
| I03       | Internet, path, and endpoint evidence never collapse into one Boolean.       | T009 to T012, T067 to T071, T073, T076 to T080 |
| I04       | Receipt is not verification.                                                 | T013 to T015                                   |
| I05       | No render/read/observer creates native or HTTP demand.                       | T001 to T002, T065 to T066, T149               |
| I06       | One opened source session is shared by active runtime leases.                | T033 to T038, T047 to T048                     |
| I07       | Resources are reserved before user callbacks can reenter.                    | T039 to T040, T053, T099                       |
| I08       | Obsolete source reads and sessions cannot overwrite current facts.           | T041 to T043, T047, T100 to T106               |
| I09       | Complete source reports do not retain omitted prior fields.                  | T016                                           |
| I10       | Subscribers see coherent immutable cached snapshots.                         | T049 to T055, T063, T150                       |
| I11       | Cancellation belongs to individual waiters, not everyone sharing work.       | T093 to T097                                   |
| I12       | Every accepted manual operation settles exactly once.                        | T038, T076, T088, T095 to T108, T159           |
| I13       | Endpoint results are scoped to session, network, endpoint, and auth context. | T100 to T101, T125 to T132                     |
| I14       | Both positive and negative endpoint evidence expire.                         | T081 to T084                                   |
| I15       | Expiry and explicit invalidation never secretly initiate I/O.                | T081 to T084, T101, T113                       |
| I16       | Observed changes revoke old evidence before new-condition notification.      | T063, T100, T127 to T128                       |
| I17       | Unsupported/error/gap information cannot masquerade as a physical fact.      | T004, T025 to T027, T045 to T046               |
| I18       | Timeout and cancellation do not depend on cooperative user promises.         | T076, T088, T102 to T104                       |
| I19       | Physically outstanding work remains bounded even after logical abort.        | T102 to T104, T123, T160                       |
| I20       | Monitors are explicit, shared, budgeted, and independent of observers.       | T109 to T124                                   |
| I21       | No self-gating check can prevent discovering recovery.                       | T113, T124                                     |
| I22       | Foreground/background behavior does not claim OS execution guarantees.       | T091 to T092, T114 to T118                     |
| I23       | Native handles preserve provider types and borrowed ownership.               | T023, T031 to T032                             |
| I24       | Scope invalidation cannot issue deferred requests with obsolete context.     | T127 to T132                                   |
| I25       | Diagnostics are bounded, passive, and redacted.                              | T066, T134, T160                               |
| I26       | Listener and cleanup failures cannot interrupt unrelated cleanup/delivery.   | T052 to T054, T158                             |
| I27       | SSR starts with client-unknown connectivity and isolated mutable state.      | T145 to T148                                   |
| I28       | Integrations translate policy without owning consumer work or global truth.  | T151 to T154                                   |
| I29       | Import boundaries match peer dependencies and platform assumptions.          | T145                                           |
| I30       | Terminal disposal cannot be reversed by any late asynchronous callback.      | T036, T104 to T106, T158 to T160               |

Cases the ledger names that are not unit tests: T057, T058 and T157 are compile-time failures, proved by `@ts-expect-error` in `packages/core/src/utils/Reach.contracts.ts`. T156 is `pnpm verify:packages`. T072, T074 and T075 follow from the HTTP adapter's design, recorded in [the decisions](../decisions.md). T139 to T144 need a device or a real browser, and are listed in [the verification matrix](../verification.md).
