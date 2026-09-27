---
description: "Reach's diagnostics: a snapshot of who holds what, counters, and events that cost nothing while nobody listens and never carry an account."
---

# Diagnostics

`network.diagnostics` is an observable snapshot of the runtime, with an event stream beside it. Reading either creates no demand.

## The snapshot

```ts
const snapshot = network.diagnostics.get();

console.info(snapshot.runtime, snapshot.adapter, snapshot.session);
console.info(snapshot.leases, snapshot.checks, snapshot.counters);

for (const endpoint of snapshot.endpoints) {
  console.info(endpoint.name, endpoint.monitors, endpoint.waiters);
}
```

| Field               | Holds                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `runtime`           | the runtime's state: `idle`, `starting`, `running`, `error`, `disposed`                         |
| `adapter`           | the adapter's name                                                                              |
| `session`           | the current source session's number, or `null`                                                  |
| `networkGeneration` | the network state's generation                                                                  |
| `capabilities`      | what the session declared, or `null`                                                            |
| `leases`            | how many runtime leases are held                                                                |
| `checks`            | `outstanding` checks running, and how many of them are `detached`                               |
| `endpoints`         | per endpoint: `monitors`, `waiters`, `status` and whether it is `checking`                      |
| `counters`          | duplicates, discarded observations, late callbacks, skipped checks, listener and cleanup errors |

A detached check is one Reach stopped waiting for, at its deadline or on a network change, whose own promise has not settled. It still holds a slot.

## Events

```ts
const stop = network.diagnostics.events.subscribe((event) => {
  console.info(
    event.type,
    event.endpoint,
    event.check,
    event.reason,
    event.networkGeneration,
  );
});

stop();
```

Events are recorded only while someone subscribes, so an application that never listens pays nothing. Each carries a `type`, a `timestamp`, the `session`, the `networkGeneration`, and where it applies the `endpoint`, the `check` number and a `reason`.

The types follow the runtime: leases acquired and released; sessions opening, opened, failed and stopped; `source-unavailable`; observations accepted, duplicated or discarded; late callbacks; the source invalidated or in error; refreshes; monitors acquired and released; and checks started, joined, completed, aborted, superseded, failed and skipped.

## What never appears

No event or snapshot carries a scope key, an account, a URL, a request or a response. An endpoint is named by the name you gave it. Diagnostics can go to an error reporter as they are; see [sibling libraries](integrations.md#flare-a-few-breadcrumbs).

## In the example

The [example application](examples.md) shows the snapshot in its status bar and the events as a timeline, and its endpoint panel counts monitors, waiting callers, running and detached checks.
