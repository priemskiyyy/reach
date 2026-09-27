---
description: "Named endpoint checks in Reach: joined, bounded, timed out, superseded by network and scope changes, and expired on their own."
---

# Endpoints and freshness

The network facts say what the device's source reported. An endpoint adds your own evidence: whether a service you name answered, when, and for which account. Its failure is that endpoint's, never the network's.

## Define one

An endpoint definition is a `check` that answers `pass`, `fail` or `inconclusive`, and how long its answer counts. [`http()`](http.md) builds one over your own HTTP client, which is what most applications need.

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

const network = new Reach({
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

network.start();
```

`network.endpoint(name)` accepts only the names you declared, and returns a handle with `state`, `available`, `check()`, `monitor()` and `invalidate()`.

## Check

```ts
const api = network.endpoint("api");

const { observation, state } = await api.check();

console.info(observation.check, observation.verdict, observation.response);
console.info(state.status, state.freshness);
```

- A caller who asks while a check runs joins it. Two callers, one request.
- Each caller can cancel only its own wait, with `check({ signal })`. The check goes on for the others.
- A check that outlives its `timeout`, 5,000 ms by default, fails with the reason `timeout`, even when its answer arrives a moment later.
- A change of connection, of scope, a stop or a disposal supersedes a running check: it rejects with `SUPERSEDED`, and its result is never committed.
- A check whose own code throws is a probe error: `check()` rejects with `PROBE_ERROR`, and the previous result stays.
- `maxOutstandingChecks`, 4 by default, bounds how many checks run at once across all endpoints, including those that ignore abort and outlive their deadline. A check beyond it rejects with `CAPACITY_EXHAUSTED`.

`check()` rejects for those reasons, and also with `ABORTED` when the caller's own signal aborts, `NOT_STARTED` while no lease holds the runtime, and `DISPOSED` after disposal. A failing endpoint is never a rejection: it is an observation with the verdict `fail`.

## State

`api.state` holds what is known now:

| Field             | Means                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| `status`          | `available`, `unavailable` or `unknown`                                           |
| `freshness`       | `never` checked, `fresh`, or `stale`                                              |
| `checking`        | whether a check is running                                                        |
| `scope`           | `unscoped`, or whether a scope key is `available`                                 |
| `lastObservation` | the last committed check: number, verdict, response, reason, times and generation |
| `lastAttempt`     | the last check started, including one that was aborted or superseded              |
| `error`           | the last error, such as a probe error                                             |

`status` is `available` or `unavailable` only while the last observation is fresh. A stale one is still in `lastObservation`, so a screen can show "the API answered 12 seconds ago, on the previous network" without claiming it holds now.

## Freshness

A result counts for `staleAfter` milliseconds from when it completed, both a pass and a failure. Then it goes stale on its own, without a new check: expiry never starts a request. Reach measures it on a monotonic clock and on the wall clock together, so a sleep that paused one still expires it.

A result also stops counting when:

- the network changes generation, because a check on the previous network says nothing about this one;
- the scope key changes, because one account's answer never speaks for another's;
- the application returns to the foreground, when Reach has an activity source, because the time away is a gap in what it observed;
- you call `api.invalidate()`, because something else told you it no longer holds, such as an upload that just failed.

```ts
const api = network.endpoint("api");

api.invalidate();

console.info(api.state.get().freshness);
```

A recheck never hides the result it may replace: while it runs, `status` stays what the last fresh result said.

## Scopes

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

network.start();
```

`scope` is an observable key, such as the signed-in account. While it is `null`, the endpoint does not check: `check()` rejects with `SCOPE_UNAVAILABLE`, and the endpoint stays `unknown` with the reason `scope-unavailable`. A new key ends the old key's check and history at once.

A scope key never appears in state, conditions or diagnostics: the endpoint only says whether it has one.

## What an endpoint cannot tell you

One endpoint covers one service. A healthy API says nothing about your upload storage or a third party's CDN; define another endpoint, or handle each request's own failure. And a passed check at one moment does not guarantee the next request: the request still handles its own failure.
