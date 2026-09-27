---
description: "Writing a Reach network adapter: available and open, complete reports, reserved reads, gaps, declared capabilities and the conformance suite."
---

# Writing an adapter

An adapter maps one source's reports onto Reach's facts, and nothing more. It is a plain object with a `name`, `available()` and `open(context)`. This one reads a source that only knows whether its link is up:

```ts
import type {
  FieldObservation,
  NetworkAdapter,
  NetworkCapabilities,
  NetworkObservation,
} from "@priemskiyyy/reach";

/** The provider, typed structurally: the adapter never imports it. */
export type LinkSource = {
  online: () => boolean;
  subscribe: (listener: () => void) => () => void;
};

const unsupported: FieldObservation<never> = { status: "unsupported" };

const CAPABILITIES: NetworkCapabilities = {
  "connection.status": {
    support: "supported",
    notifications: "complete",
    bases: ["custom"],
  },
  "connection.type": { support: "unsupported" },
  "connection.transports": { support: "unsupported" },
  "internet.status": { support: "unsupported" },
  "cost.metered": { support: "unsupported" },
  "cost.expensive": { support: "unsupported" },
  "preferences.constrained": { support: "unsupported" },
  "preferences.saveData": { support: "unsupported" },
};

const read = (source: LinkSource): NetworkObservation => ({
  connection: {
    status: {
      status: "current",
      value: source.online() ? "connected" : "disconnected",
      basis: "custom",
    },
    type: unsupported,
    transports: unsupported,
  },
  internet: { status: unsupported },
  cost: { metered: unsupported, expensive: unsupported },
  preferences: { constrained: unsupported, saveData: unsupported },
});

export const link = (source: LinkSource): NetworkAdapter<LinkSource> => ({
  name: "link",
  available: () => true,
  open: (context) => {
    // Subscribe first, so a change during the first read is not lost.
    const stop = source.subscribe(() => context.emit(read(source)));

    context.onDispose(stop);
    context.emit(read(source));

    return {
      native: source,
      capabilities: CAPABILITIES,
      refresh: ({ emit }) => emit(read(source)),
    };
  },
});
```

## The rules

- **Cold until opened.** Creating the adapter reads nothing and subscribes to nothing. `available()` probes the host cheaply: a host without the source answers `false`, and the runtime runs with every fact unsupported instead of failing.
- **Subscribe, then read.** Add the listener before the first read, so a change during that read is not lost.
- **Complete reports.** Every `emit` reports every fact. A fact left `unknown` is unknown; nothing keeps an earlier value.
- **Never stronger than the source.** An ambiguous answer is `unknown` with `source-ambiguous`, never offline. A fact the source cannot observe is declared and reported `unsupported`, and only such a fact is. A report's basis must be one its capability declares.
- **Ordered reads.** A read that finishes later calls `context.reserve()` when it starts, and reports through the slot it got, so an event that arrived meanwhile wins.
- **Gaps.** When the source knows it may have missed changes, such as a switch to another network of the same type that the facts cannot show, call `context.invalidate()`. Every fact goes stale and a new generation starts.
- **Errors.** `context.reportError(error)` turns every fact into an error, never offline. A throwing `open` fails the opening.
- **Borrowed SDKs.** Take the SDK as an option; never import or configure it. Remove only your own listeners, through `context.onDispose`.
- **Refresh.** An optional `refresh({ signal, emit })` reads again and reports. Without it, `network.refresh()` answers `unsupported`.

## Prove it

Run the conformance suite from `@priemskiyyy/reach/testing` against a fake of your provider that counts its listeners:

```ts
import type { NetworkAdapter } from "@priemskiyyy/reach";
import { testNetworkAdapter } from "@priemskiyyy/reach/testing";

type LinkSource = {
  online: () => boolean;
  subscribe: (listener: () => void) => () => void;
};

// The adapter above.
declare const link: (source: LinkSource) => NetworkAdapter<LinkSource>;

const createFakeLink = () => {
  const listeners = new Set<() => void>();
  let online = true;

  return {
    source: {
      online: () => online,
      subscribe: (listener: () => void) => {
        listeners.add(listener);

        return () => {
          listeners.delete(listener);
        };
      },
    },
    toggle: () => {
      online = !online;

      for (const listener of [...listeners]) {
        listener();
      }
    },
    count: () => listeners.size,
  };
};

const { passed } = await testNetworkAdapter(() => {
  const fake = createFakeLink();

  return {
    adapter: link(fake.source),
    change: fake.toggle,
    settle: () => Promise.resolve(),
    subscriptionCount: fake.count,
  };
});

console.info(passed);
```

The suite runs seven checks, each on its own Reach that is disposed however the check ends: creating and probing the adapter subscribes to nothing, opening declares a capability for every fact, every report is complete and within the declared capabilities, a change is reported, releasing removes every subscription without a cleanup throwing, a second session observes again, and a refresh reports what it read.

Write a `*.contracts.ts` file too, proving the real SDK's types fit the structural ones your adapter declares, as every adapter in this repository does.
