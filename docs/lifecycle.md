---
description: "The Reach runtime's lifetime: construction, leases, the source session, refresh, errors and terminal disposal."
---

# Lifecycle

A Reach is a runtime your application owns. Its lifetime has four parts: construction, leases, the source session, and disposal.

## Construction opens nothing

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";

const network = new Reach({ adapter: browser() });

console.info(network.status.get());
```

Constructing a Reach validates its options, opens nothing, arms no timer and reads no clock. Invalid options, such as a duration that is not a positive whole number of milliseconds, throw a `ReachError` with `INVALID_CONFIGURATION` here and nowhere later.

## Leases

```ts
const lease = network.start();

await lease.ready;

lease.release();
```

- The first lease opens the source; the last release closes it. Concurrent owners share one session.
- `ready` resolves once the source is adopted, which says nothing about connectivity. It rejects when opening fails or times out, or when the lease is released first.
- `release()` is idempotent and ends only its own hold.
- A React provider with `start` holds one lease while mounted; see [React](react.md).

## Status

`network.status` is a union on `state`:

| `state`    | Means                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------- |
| `idle`     | no lease holds the runtime                                                                    |
| `starting` | the source is opening                                                                         |
| `running`  | the source is adopted; `refreshing` says whether a refresh is under way                       |
| `error`    | opening failed, with the `error`; a later `start()` or `refresh()` tries again, never a timer |
| `disposed` | terminal                                                                                      |

Opening waits `timeouts.open`, 10,000 ms by default. A source that never answers fails with `SOURCE_TIMEOUT`, and if it answers later its cleanups run at once and it is never adopted.

## An unavailable host

An adapter says whether this host has its source at all. Where it answers no, such as the browser adapter on a server or a native adapter on the web, the runtime still starts: every fact is `unsupported` for the reason `source-unavailable`, every capability is unsupported, and diagnostics record `source-unavailable`. Every condition on a fact is `unknown`, and nothing fails that was never going to work there.

## Refresh

```ts
const { status, state } = await network.refresh();

console.info(status, state.generation);
```

`refresh()` asks the source to read again. It resolves with `updated`, `unchanged`, `superseded` when a newer report won, or `unsupported` for a source that cannot refresh. It waits `timeouts.refresh`, 10,000 ms by default, and a caller can abort its own wait with `refresh({ signal })`.

## Errors from the source

A source that reports an error turns its facts into `error`, never offline, and its next good report recovers them. A throwing listener, cleanup, scope or evaluator is isolated: it is counted in diagnostics and never interrupts delivery to the others. Reach never throws into your application from a callback.

## Disposal

```ts
network.dispose();
```

Disposal is terminal. It releases every lease, supersedes every check, rejects every pending wait with `DISPOSED`, runs every cleanup even when one throws, and ignores every late callback. `start()` after `dispose()` throws; create a new Reach instead. Reading state after disposal still works and returns the last snapshot, with every fact stale.
