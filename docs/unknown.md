---
description: "Recipes for what a feature does when a Reach condition is unknown: wait, try, ask, or fall back, and why Reach does not decide it for you."
---

# Deciding on unknown

Every condition can be `unknown`, and on some platforms some conditions always are: a browser cannot tell metering, and nothing on iOS can. Reach reports that honestly. What a feature does with it is the feature's decision, and it should be written down in one place.

## A table per feature

Decide once, as data, and read the table where the feature runs:

```ts
import type { ConditionStatus } from "@priemskiyyy/reach";

type AutomaticDecision = "back-up" | "wait" | "pause";
type ManualDecision = "upload" | "try" | "refuse";

// Nobody asked for an automatic backup, so an unknown answer waits.
const AUTOMATIC: Record<ConditionStatus, AutomaticDecision> = {
  met: "back-up",
  unknown: "wait",
  unmet: "pause",
};

// Somebody pressed the button, so an unknown answer is worth a try.
const MANUAL: Record<ConditionStatus, ManualDecision> = {
  met: "upload",
  unknown: "try",
  unmet: "refuse",
};

const { status } = network.endpoint("api").available.get();

console.info(AUTOMATIC[status], MANUAL[status]);
```

The [example application](examples.md) is built on exactly these two tables.

## Common choices

| The feature is                          | On unknown, usually | Why                                                                 |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| something the user asked for            | try                 | the request itself is the best evidence, and its failure is visible |
| automatic work that costs the user data | wait, and say why   | nobody asked, and guessing wrong costs them                         |
| automatic work that is cheap            | try                 | a failure costs little and teaches the most                         |
| a banner that says "you are offline"    | show nothing        | unknown is not offline                                              |
| TanStack Query's online manager         | online, the default | Query retries and caches on its own                                 |

## Say why

`reasons` tells your user what Reach could not tell. A wait with no explanation reads as a broken app:

```ts
const unmetered = network.condition({ metered: false });

const explain = () => {
  const { status, reasons } = unmetered.get();

  if (status !== "unknown") {
    return null;
  }

  if (reasons.some(({ code }) => code === "unsupported")) {
    return "This device cannot tell whether the connection is metered.";
  }

  return "Waiting to learn whether the connection is metered.";
};

console.info(explain());
```

A wait caused by a fact this platform never reports needs an exit the user controls, such as a setting that allows any network. Otherwise it waits forever.

## Do not coerce

```ts
const unmetered = network.condition({ metered: false });

// Wrong: unknown becomes "metered", so the upload never runs on the web.
const wrong = unmetered.get().status === "met";

// Wrong the other way: unknown becomes "unmetered".
const alsoWrong = unmetered.get().status !== "unmet";

console.info(wrong, alsoWrong);
```

Each of those lines picks a side for every platform at once, silently. Write the choice where the feature decides, with the status in hand.
