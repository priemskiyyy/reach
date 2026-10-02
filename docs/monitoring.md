---
description: "Monitoring in Reach: demand that checks an endpoint on start, network changes, a new scope and the foreground, bounded and never a retry loop."
---

# Monitoring

Nothing checks an endpoint unless something asks. `check()` asks once. `monitor()` asks for as long as you hold it, and the endpoint's `monitoring` policy says when to check:

```ts
import { Reach } from "@priemskiyyy/reach";
import type { Activity, ObservableValue } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

const activity: ObservableValue<Activity> = {
  get: () =>
    document.visibilityState === "visible" ? "foreground" : "background",
  subscribe: (listener) => {
    document.addEventListener("visibilitychange", listener);

    return () => {
      document.removeEventListener("visibilitychange", listener);
    };
  },
};

const network = new Reach({
  adapter: browser(),
  activity,
  endpoints: {
    api: http({
      request: ({ signal }) => client.health.get({ signal }),
      staleAfter: 30_000,
      monitoring: {
        on: ["start", "network-change", "scope-change", "foreground"],
        interval: 15_000,
        minInterval: 2_000,
      },
    }),
  },
});

network.start();

const stopMonitoring = network.endpoint("api").monitor();

stopMonitoring();
```

## The policy

| Option                 | Default                       | Means                                                                          |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `on`                   | `["start", "network-change"]` | the triggers that start a check                                                |
| `interval`             | `false`                       | also check this often, in milliseconds                                         |
| `minInterval`          | 1,000                         | never start two automatic checks closer together                               |
| `jitter`               | 0                             | delay each interval by up to this share of it, from 0 to 1                     |
| `whenOffline`          | `skip`                        | whether a native report of no path skips automatic checks                      |
| `allowWithoutActivity` | `false`                       | allow an `interval` although no activity source can pause it in the background |

The triggers:

- `start`: the first monitor, or a runtime that starts while monitored.
- `network-change`: a new generation.
- `scope-change`: a new scope key.
- `foreground`: a return to the foreground, from the activity source.

## Demand, not a scheduler

- **Shared.** Every `monitor()` shares one policy. The first creates demand, and the last release ends it. Diagnostics count the owners.
- **Observers are not demand.** Reading `state`, subscribing to `available`, and every React hook observe only. A hundred components watching the endpoint send nothing.
- **Bounded.** Triggers inside `minInterval` become one check. Without an `interval`, a monitor never polls.
- **Never a retry loop.** A failure is not a trigger. A monitored endpoint that failed stays unavailable until its result goes stale, and is checked again on the next trigger or interval.
- **Foreground only.** With an activity source, automatic checks wait for the foreground. A return to it is a gap: the generation advances, so every older result ends, the source is read again, and endpoints monitored with the `foreground` trigger check once. A `foreground` trigger without an activity source is a configuration error, and so is an `interval` unless you set `allowWithoutActivity`. Until that read answers, facts stay `current` with the values they had before the suspension, so await `refresh()` before a decision that cannot tolerate a stale yes.
- **No path, no check.** A native report of no path skips automatic checks, unless `whenOffline` is `attempt`. A browser's hint never skips one, because a hint is not a path. A manual `check()` always runs: it is the caller's decision. A report of no path can be older than the path, so each skipped trigger is confirmed by one read of the source, and offered again when that read finds the path back. That costs at most one native read per skipped trigger while offline, shared with any read already under way and bounded by `timeouts.refresh`.

## Recovery without an event

An endpoint that recovers says nothing. A monitor learns of it on the next trigger: a network change, a new account, a return to the foreground or the next interval. With no interval and no event, a failed endpoint stays failed until its result goes stale, and then stays unknown until something checks. Choose an `interval` if your application must notice recovery on its own.
