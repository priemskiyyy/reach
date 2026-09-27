---
description: "Create a Reach over the browser, define an endpoint through your own client, and decide with conditions that can be unknown."
---

# Getting started

This page builds a small setup for a web application: one Reach over the browser, one endpoint for your API, and two conditions. The same steps apply in React Native with another adapter.

## Install

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-browser @priemskiyyy/reach-http
```

## Create the Reach

Create it once, where your application creates its other long-lived services:

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

export const network = new Reach({
  adapter: browser(),
  endpoints: {
    api: http({
      request: ({ signal }) => client.health.get({ signal }),
      test: ({ status }) => status === "ready",
      staleAfter: 30_000,
      timeout: 3_000,
    }),
  },
});
```

Constructing it opens nothing, arms no timer and reads no clock. `request` is your own client: it resolves with the parsed answer, and `test` reads that answer with its type.

## Start it

```ts
const lease = network.start();

await lease.ready;
```

`start()` returns a lease. The source opens on the first lease and closes when the last one is released. `ready` resolves once the source is adopted, which says nothing about connectivity.

## Read the network

```ts
const { connection, internet, evidence } = network.state.get();

console.info(connection.status, internet.status);
console.info(evidence["connection.status"]);
```

In a browser, `connection.status` rests on a `browser-hint`, and `internet.status` is `unsupported`: a browser cannot tell whether the internet works, so Reach does not pretend it can.

## Decide with conditions

```ts
import { all } from "@priemskiyyy/reach";

const api = network.endpoint("api");
const unmetered = network.condition({ metered: false });
const automaticSync = all(api.available, unmetered);

automaticSync.subscribe(() => {
  const { status, reasons } = automaticSync.get();

  if (status === "met") {
    console.info("sync now");

    return;
  }

  console.info(`not now, ${status}`, reasons);
});
```

In a browser, metering is unsupported, so `automaticSync` stays `unknown` with the reason `unsupported` on `cost.metered`. That is the honest answer, and your code decides what to do with it.

## Check the API

```ts
const { observation, state } = await network.endpoint("api").check();

console.info(observation.verdict, state.status, state.freshness);
```

A check that passed makes `api.available` met until the result goes stale. Callers who ask while a check runs join it. To check on your own triggers instead of by hand, see [monitoring](monitoring.md).

## Dispose

```ts
network.dispose();
```

Disposal is terminal: it settles everything pending, runs every cleanup, and a disposed Reach never starts again. Create a new one instead.

## Next

- [Evidence, not a Boolean](mental-model.md): what each fact and its evidence mean.
- [Deciding on unknown](unknown.md): what to do when a condition cannot tell.
- [React](react.md), [React Native and Expo](react-native.md) and [TanStack Query](tanstack-query.md).
