---
description: "Answers to the questions Reach raises in practice: unknown internet, unsupported metering, stale endpoints, idle monitors, superseded checks and exhausted capacity."
---

# Troubleshooting

## Why is internet unknown on iOS or in a browser?

Because neither can tell you. A browser's `onLine` says it has a local link, never that the internet works, so the browser adapter declares `internet.status` unsupported. On iOS, NetInfo's reachability is its own request's report, and a false one while connected can be a failed request or one it skipped; Expo Network's iOS reachability copies the path status. Reach keeps each of those as `unknown` instead of guessing. To know whether your service answers, check it: see [endpoints](endpoints.md).

## Why is metering unsupported?

Only Android reports metering, through NetInfo. The browser has no such fact, iOS derives NetInfo's flag from the cellular transport, which is neither metering nor cost, and Expo Network reports no cost at all. A condition on `metered` stays `unknown` there, with the reason `unsupported`. Decide what your feature does then, and give the user an exit: see [deciding on unknown](unknown.md).

## Why did a failed API check not mark the device offline?

Because one endpoint's failure is that endpoint's. The API can be down while the network works, and a captive portal, a blocked CORS request or a service worker can fail a request on a working network. The check's result goes to `api.state` and `api.available`; the network facts do not change.

## Why did a previously available endpoint become unknown?

Its last result stopped counting. `lastObservation` still holds it, and one of these ended it:

- it is older than `staleAfter`;
- the network changed generation, because a check on the previous network says nothing about this one;
- the scope key changed, such as a new account;
- the app returned to the foreground, with an activity source;
- something called `invalidate()`.

A new check replaces it. Expiry itself never starts one.

## Why are checks not running while I observe the endpoint?

Observing is not demand. Reading `state` or `available`, subscribing, and every React hook send nothing. Call `check()`, or hold a `monitor()` and give the endpoint a `monitoring` policy. A monitor also needs a running runtime, the foreground when there is an activity source, and a trigger; a native report of no path skips automatic checks unless `whenOffline` is `attempt`.

## Why does a monitor not notice that the backend recovered?

A recovery sends no event. A monitor checks again on its triggers: a network change, a new account, a return to the foreground, and its `interval` if you set one. Without an interval, a failed endpoint stays unavailable until its result goes stale, and then unknown until something checks. Set an `interval` if your application must notice recovery on its own. Reach never retries a failure in a loop.

## Why can a borrowed SDK still make requests?

Because it is yours. NetInfo runs its own reachability requests whatever Reach reads; `internet: "ignore"` only leaves them out of Reach. Configure the SDK itself to change what it does. Reach never configures a borrowed SDK and removes only its own listeners.

## Why did a check reject with SUPERSEDED?

Something made its answer meaningless before it arrived: the connection changed, the scope key changed, the runtime stopped, or a return to the foreground started a new generation. Its signal aborted, and its result is never committed. A superseded check is not a failure of the endpoint; a monitored endpoint checks again on the new network.

## Why did capacity become exhausted after ignored aborts?

`maxOutstandingChecks`, 4 by default, bounds checks that physically run. A check whose client ignores its signal keeps running after Reach stopped waiting, at its deadline or on a change, and it holds its slot as detached work until its own promise settles. Enough of those at once and the next check rejects with `CAPACITY_EXHAUSTED`. `diagnostics.get().checks.detached` counts them. Pass the signal to your client, and use one that honors it.

## Why is a native field only reachable through `native`?

Reach models a fact only when it means the same on every source that reports it. An effective type such as `4g` is a speed estimate, not a transport, and provider details differ by platform. Read them through [native access](native-access.md), where they carry no evidence, freshness or generation.

## Why does start() throw?

The Reach was disposed. Disposal is terminal; create a new one.

## Why is an endpoint unknown with scope-unavailable?

Its scope key is `null`, such as while nobody is signed in. A scoped endpoint does not check without a key, and never uses another key's answer.
