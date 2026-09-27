---
description: "Reach beside its sibling libraries: Pulse as the activity source, a Silo preference in a condition, Simulcast and Flare, each keeping its own responsibility."
---

# Sibling libraries

A condition is an `ObservableValue` of `{ status, reasons }`, a `get` and a `subscribe`. That is the whole boundary: a sibling library reads it structurally, without importing Reach, and keeps its own responsibilities.

## Pulse: the activity source

Pulse knows whether the app is in the foreground. Reach needs exactly that to gate automatic checks, and nothing more:

```ts
import { Pulse } from "@priemskiyyy/pulse";
import { browser as pageLifecycle } from "@priemskiyyy/pulse/browser";
import { Reach } from "@priemskiyyy/reach";
import type { Activity, ObservableValue } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";

const pulse = new Pulse({ adapter: pageLifecycle() });

// Only the phase: whether the user is interacting says nothing about the network.
const activity: ObservableValue<Activity> = {
  get: () => pulse.state.get().phase,
  subscribe: pulse.state.subscribe,
};

pulse.start();

const network = new Reach({ adapter: browser(), activity });

network.start();
```

Pulse's `phase` is `foreground`, `background` or `unknown`, the same three values as Reach's activity, and Pulse's `unknown` stays unknown here too. In React Native, give Pulse its React Native adapter and nothing else changes.

## Silo: a preference is policy

A stored preference, such as "allow uploads on metered connections", decides a condition. It is not a network fact:

```ts
import { createCondition } from "@priemskiyyy/reach";

const allowMeteredUploads = silo.value("allowMeteredUploads");

export const uploadAllowed = createCondition({
  sources: {
    state: network.state,
    allowed: allowMeteredUploads,
    preference: allowMeteredUploads.status,
  },
  evaluate: ({ state, allowed, preference }) => {
    // A preference still on its way from storage is not an answer yet.
    if (preference.state === "hydrating") {
      return "unknown";
    }

    if (allowed) {
      return "met";
    }

    if (state.cost.metered === null) {
      return "unknown";
    }

    return state.cost.metered ? "unmet" : "met";
  },
});
```

Never persist Reach's state and hydrate the next launch from it. A stored endpoint success is history, not evidence about the network now.

## Simulcast: advice, not truth

A realtime connection has its own reconnect loop, and a live socket can keep working while a generic check is uncertain. Use Reach to offer a reconnect once the client gave up and the device has a link again, never to tear a connection down:

```ts
let disconnect = realtime.connect();

// A browser only hints at a link, so this is a nudge, never a verdict on the socket.
const linked = network.condition({ connection: "connected" });

linked.subscribe(() => {
  if (linked.get().status !== "met") {
    return;
  }

  if (realtime.connection.get() !== "disconnected") {
    return;
  }

  disconnect();
  disconnect = realtime.connect();
});
```

Simulcast's `connection` is `disconnected` only when it will not reconnect on its own, so this never competes with its loop.

## Flare: a few breadcrumbs

Diagnostics events are passive and never carry an account. Pass a few of them to Flare as breadcrumbs, and leave out the routine ones:

```ts
import type { ReachDiagnosticEventType } from "@priemskiyyy/reach";

const BREADCRUMBS = new Set<ReachDiagnosticEventType>([
  "session-failed",
  "source-error",
  "source-invalidated",
  "check-completed",
  "check-failed",
  "check-superseded",
]);

network.diagnostics.events.subscribe(
  ({ type, endpoint, reason, networkGeneration }) => {
    if (!BREADCRUMBS.has(type)) {
      return;
    }

    // A passed check is routine.
    if (type === "check-completed" && reason === "pass") {
      return;
    }

    flare.breadcrumb("network", {
      type,
      endpoint,
      reason,
      generation: networkGeneration,
    });
  },
);
```

Subscribing to events acquires no lease and starts no monitor.

## Work libraries

A job scheduler or a transfer library can read a condition before it starts work, and decide what `unknown`, `unmet` and unsupported mean for that work. The work stays theirs:

- A met condition at one moment does not authorize a transfer on whatever route exists a minute later. The transfer still handles connection changes, failures, cancellation and partial progress.
- A native scheduler constraint, such as an OS-level "unmetered only" job, is configured on its own. A Reach condition cannot be serialized into one.
- A wait on a fact this platform never reports needs an exit the application controls, or it waits forever.
- Do not cancel every running transfer on an uncertain change. Pause, finish the current chunk or continue: that choice belongs to the transfer.
