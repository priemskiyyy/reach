---
description: "Reach on a server and during hydration: an unavailable source, deterministic unknown snapshots, and one Reach per client."
---

# Server rendering

A server cannot know the client's network, and Reach does not pretend to.

## On the server

The browser adapter is unavailable without a `window`. A Reach started on a server runs with every fact `unsupported` for the reason `source-unavailable`, so every condition on a fact is `unknown`. Nothing throws.

Do not share a started Reach between users on a server. Create one per request if a server render needs one, or none at all: the hooks below do not need it.

## Hydration

`@priemskiyyy/reach-react` reads deterministic snapshots on the server and during the hydrating render:

- every fact `unknown`, with evidence `unobserved`;
- every condition `unknown`, with the reason `unobserved`;
- every endpoint never checked and unscoped, because a server cannot know the client's account.

The first client render after hydration reads the real state, so hydration never mismatches and nothing about the server's own network reaches the client.

## Create it on the client

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";

export const network = new Reach({ adapter: browser() });

if (typeof window !== "undefined") {
  network.start();
}
```

Or let the provider hold the lease, which only happens in an effect, so never on the server: `<ReachProvider network={network} start>`.

## Persisted state

Never hydrate a Reach from a stored snapshot. A stored endpoint success is history, not evidence about the client's network now, and Reach has no way to admit it as current. Show it as history if it matters to your users.
