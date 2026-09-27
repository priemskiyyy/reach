---
description: "Reach is reactive network state and conditions for TypeScript, with explicit uncertainty, scoped endpoint checks and deterministic ownership, on the web and in React Native."
---

# What Reach is

Reach keeps one model of what your application knows about the network: what its source reported, on what basis, and how long ago. It derives conditions that are `met`, `unmet` or `unknown` from that model, and checks the endpoints you name.

```ts
import { all, Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

const network = new Reach({
  adapter: browser(),
  endpoints: {
    api: http({
      request: ({ signal }) => client.health.get({ signal }),
      test: ({ status }) => status === "ready",
      staleAfter: 30_000,
    }),
  },
});

const upload = all(
  network.endpoint("api").available,
  network.condition({ metered: false }),
);

network.start();

upload.subscribe(() => {
  const { status, reasons } = upload.get();

  console.info(status, reasons);
});
```

The runtime belongs to your application: you create it, start it and dispose of it. Reach adds no global state and makes no request you did not define.

## Why there is no isOnline

There is no `isOnline` property, and no condition turns into a Boolean on its own. The web and both React Native sources each have a way to say `false` that does not mean offline: a browser's `onLine` is a guess about a local link, NetInfo answers `false` when its own reachability request failed, and Expo Network's iOS read answers a timeout the same way as no path. A Boolean would have to pick a side for every one of those, and your application would inherit the guess without knowing it was one.

Instead, a condition says `met`, `unmet` or `unknown`, and gives its reasons. Each feature decides what unknown means for it: an automatic backup can wait, and a button the user pressed can try. [Deciding on unknown](unknown.md) shows the common choices.

## The guarantee, and where it ends

Reach guarantees how evidence is recorded and ordered, how conditions are derived from it, and how checks are joined, bounded, timed out, scoped and expired. It never upgrades evidence: a browser hint is not internet, a provider's report is not verification, and a passed check of one endpoint says nothing about another.

Reach does not tell you that the internet works, detect every network change, enforce anything about your uploads, or retry and queue requests. A met condition is evidence at one moment; the transfer that follows still handles its own failures.

## Where to go next

- [Getting started](getting-started.md) builds a working setup in a few minutes.
- [Evidence, not a Boolean](mental-model.md) explains facts, evidence, capabilities and generations.
- [Choose an adapter](adapters.md) compares what each source can honestly report.
- [The example application](examples.md) runs a photo app on Reach inside one page.
