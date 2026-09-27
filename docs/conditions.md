---
description: "Conditions in Reach: requirements on facts, endpoint availability, three-valued combinators and custom conditions, each with its reasons."
---

# Conditions

A condition is an observable `{ status, reasons }`, where `status` is `met`, `unmet` or `unknown`. It is derived on read, so it costs nothing until something reads it, and it never glitches: every listener sees conditions consistent with the same state.

## Requirements on facts

```ts
const onWifi = network.condition({ connection: "connected", type: "wifi" });
const unmetered = network.condition({ metered: false, constrained: false });
const internet = network.condition({ internet: "online" });

console.info(onWifi.get(), unmetered.get(), internet.get());
```

A requirement names at least one of `connection`, `internet`, `type`, `metered`, `expensive`, `constrained` and `saveData`; an empty one fails to compile. Every named fact must hold:

- A fact that holds adds nothing.
- A fact that differs makes the condition `unmet`, with the reason `mismatch` on that field.
- A fact that is not current makes it `unknown`, with the fact's own reason: `unobserved`, `unsupported`, `source-ambiguous` and so on.
- `unmet` wins over `unknown`: one fact that is known to differ is enough.

```ts
const unmetered = network.condition({ metered: false, constrained: false });
const { status, reasons } = unmetered.get();

for (const { code, field } of reasons) {
  console.info(status, code, field);
}
```

## Endpoint availability

`network.endpoint("api").available` is a stable condition: `met` while a current check passed, `unmet` with `endpoint-unavailable` while a current check failed, and `unknown` otherwise, with `unobserved`, `stale`, `scope-unavailable` or the check's own reason for an inconclusive answer. See [endpoints and freshness](endpoints.md).

## Combinators

```ts
import { all, any, not } from "@priemskiyyy/reach";

const api = network.endpoint("api").available;
const unmetered = network.condition({ metered: false });
const onCellular = network.condition({ type: "cellular" });

const automaticUpload = all(api, unmetered);
const anyLink = any(
  network.condition({ type: "wifi" }),
  network.condition({ type: "ethernet" }),
);
const offCellular = not(onCellular);

console.info(automaticUpload.get(), anyLink.get(), offCellular.get());
```

| Combinator | `met` when       | `unmet` when       | otherwise |
| ---------- | ---------------- | ------------------ | --------- |
| `all`      | every one is met | any one is unmet   | `unknown` |
| `any`      | any one is met   | every one is unmet | `unknown` |
| `not`      | it is unmet      | it is met          | `unknown` |

`all` and `any` take at least one condition. The reasons of the deciding inputs carry through, so `all(api, unmetered)` unmet on cellular says `mismatch` on `cost.metered`.

## Custom conditions

`createCondition` derives a condition from any observable values, such as a user setting:

```ts
import { createCondition } from "@priemskiyyy/reach";

const uploadAllowed = createCondition({
  sources: { state: network.state, settings },
  evaluate: ({ state, settings }) => {
    if (settings.allowAnyNetwork) {
      return "met";
    }

    if (state.cost.metered === null) {
      return {
        status: "unknown",
        reasons: [
          { code: "unsupported", field: "cost.metered", endpoint: null },
        ],
      };
    }

    return state.cost.metered ? "unmet" : "met";
  },
});

console.info(uploadAllowed.get());
```

An evaluator returns a status, or a status with reasons. One that throws makes the condition `unknown` with `evaluation-error`, and a later valid read recovers.

## Reading a condition

A condition is an `ObservableValue`: `get()` reads it, and `subscribe(listener)` calls back on every change of status or reasons and returns the unsubscribe function. Subscribing starts nothing: no source opens and no check runs because something reads a condition. In React, read one with `useCondition`.

## Why there is no isOnline

A condition never becomes a Boolean on its own, and there is no `isOnline` property. `unknown` has to go somewhere, and where it should go depends on the feature. See [deciding on unknown](unknown.md).
