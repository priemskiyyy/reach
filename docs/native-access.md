---
description: "Reaching the provider's own object through network.native, when a field Reach does not model is the one you need."
---

# Native access

`network.native` is the adapter's own object for the current session, or `null` before one opens:

| Adapter      | `native`                                                   |
| ------------ | ---------------------------------------------------------- |
| browser      | `{ connection }`, the Network Information object or `null` |
| NetInfo      | the NetInfo module you passed                              |
| Expo Network | the `expo-network` module you passed                       |

It is typed with the structural type the adapter declares, which covers the part of the provider the adapter uses. A field beyond it has to be narrowed:

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";

const network = new Reach({ adapter: browser() });

network.start();

network.native.subscribe(() => {
  const connection = network.native.get()?.connection ?? null;

  if (connection !== null && "effectiveType" in connection) {
    console.info(connection.effectiveType);
  }
});
```

For NetInfo and Expo Network, the object is the module you passed in, so keep your own typed reference to it instead of reading it back through Reach.

## When to use it

Use it for a field Reach deliberately does not model, such as an effective type like `4g`, which is a speed estimate and not a transport, or a provider detail your feature depends on and you have verified on your devices. Reach does not normalize those, because their meaning differs by provider and platform.

## What it does not give you

- **No evidence.** A value read through `native` has no basis, freshness or generation. Reach does not know you read it.
- **No ownership.** The SDK stays yours and borrowed: do not configure it through `native`, and do not remove listeners you did not add.
- **No lifetime.** A new session can replace the object. Subscribe to `network.native`, or read it again after a restart.
