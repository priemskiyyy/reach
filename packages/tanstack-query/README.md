# @priemskiyyy/reach-tanstack-query

Feed a [Reach](https://github.com/priemskiyyy/reach/tree/main/packages/core) condition to TanStack Query's online manager. `toOnlineEventListener()` returns the setup function the manager installs, so Query pauses and resumes on the evidence you choose.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-tanstack-query
```

The bridge imports nothing from Query. It works with any Query adapter that exposes `onlineManager`.

## Install it once

```ts
import { toOnlineEventListener } from "@priemskiyyy/reach-tanstack-query";
import { onlineManager } from "@tanstack/query-core";

onlineManager.setEventListener(
  toOnlineEventListener(network.condition({ internet: "online" })),
);
```

Install it once, at bootstrap, not per component or per `QueryClient`. `setEventListener` replaces the previous setup and runs its cleanup; the bridge cannot restore whatever was installed before it.

## What Query hears

| The condition | Query hears          |
| ------------- | -------------------- |
| `met`         | online               |
| `unmet`       | offline              |
| `unknown`     | the `unknown` policy |

| `unknown`          | Meaning                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `online` (default) | Query may attempt requests.                                           |
| `offline`          | Query pauses.                                                         |
| `preserve`         | Nothing is published, at setup either: the manager keeps what it has. |

Online means Query may treat networking as available, not that Reach verified the internet. With the browser adapter, `internet` stays unknown, so the default keeps Query permissive even while the browser says it is offline. That is deliberate: `onLine` is only a hint. To let the hint pause Query, choose it explicitly and accept its limits:

```ts
import { toOnlineEventListener } from "@priemskiyyy/reach-tanstack-query";
import { onlineManager } from "@tanstack/query-core";

onlineManager.setEventListener(
  toOnlineEventListener(network.condition({ connection: "connected" }), {
    unknown: "online",
  }),
);
```

## Behavior

- The listener subscribes before it reads, so a change during setup is never missed.
- The same Boolean is never published twice.
- After its cleanup, the listener publishes nothing, even from a notification already under way.
- Do not pass an endpoint's condition. One API's failure would pause every query, including the one that would find it recovered. Show that endpoint's state where it matters instead.
- Query's retries, caching, focus handling and network modes stay Query's.

For a browser application with no other use for Reach, Query's own online manager may be all you need.
