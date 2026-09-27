---
description: "@priemskiyyy/reach-tanstack-query: a Reach condition as TanStack Query's online manager, with an explicit choice for unknown."
---

# TanStack Query

`toOnlineEventListener()` from `@priemskiyyy/reach-tanstack-query` turns a condition into the setup function TanStack Query's online manager installs, so Query pauses and resumes on the evidence you choose. It imports nothing from Query.

```ts
import { toOnlineEventListener } from "@priemskiyyy/reach-tanstack-query";
import { onlineManager } from "@tanstack/query-core";

onlineManager.setEventListener(
  toOnlineEventListener(network.condition({ internet: "online" })),
);
```

Install it once, at bootstrap. `setEventListener` replaces the previous setup and runs its cleanup; the bridge cannot restore whatever was installed before it.

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

Online means Query may treat networking as available, not that Reach verified the internet. With the browser adapter, `internet` is unsupported, so the default keeps Query permissive even while the browser says it is offline. To let the browser's hint pause Query, choose it explicitly:

```ts
import { toOnlineEventListener } from "@priemskiyyy/reach-tanstack-query";
import { onlineManager } from "@tanstack/query-core";

onlineManager.setEventListener(
  toOnlineEventListener(network.condition({ connection: "connected" })),
);
```

## Do not pass an endpoint

One API's failure would pause every query, including the one that would find it recovered. Show an endpoint's state where it matters instead.

## Behavior

- The listener subscribes before it reads, so a change during setup is never missed.
- The same Boolean is never published twice.
- After its cleanup, the listener publishes nothing, even from a notification already under way.
- Query's retries, caching, focus handling and network modes stay Query's.
