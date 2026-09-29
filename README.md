# Reach

**Network evidence for TypeScript applications, on the web and in React Native.**

Reach keeps one model of what your application knows about the network: what the source reported, on what basis, and how long ago. It derives three-valued conditions from it, and checks the endpoints you name.

```ts
import { all, Reach } from "@priemskiyyy/reach";
import { http } from "@priemskiyyy/reach-http";
import { netInfo } from "@priemskiyyy/reach-netinfo";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

export const network = new Reach({
  adapter: netInfo({ sdk: NetInfo, platform: Platform.OS }),
  endpoints: {
    api: http({
      request: ({ signal }) => client.health.get({ signal }),
      test: ({ status }) => status === "ready",
      staleAfter: 30_000,
    }),
  },
});

export const unmetered = network.condition({ metered: false });
export const automaticUpload = all(
  network.endpoint("api").available,
  unmetered,
);

network.start();

automaticUpload.subscribe(() => {
  if (automaticUpload.get().status === "met") {
    startUploads();
  }
});
```

## Why not read the source directly

`navigator.onLine`, NetInfo and Expo Network each answer a slightly different question, and each has a way to say `false` that does not mean offline. Reach owns what surrounds the call:

- **Unknown is an answer.** A missing fact is `unknown`, never `false`. A condition is `met`, `unmet` or `unknown`, and says why.
- **Evidence has a basis.** A browser hint, a provider's report, a native path, a validated network and a passed endpoint check are different kinds of evidence. Reach never upgrades one into another.
- **Order and generations.** A slow read never overwrites a newer event, and a connection change supersedes every check that started before it.
- **Endpoint checks with lifetimes.** Checks are joined, bounded, timed out, scoped to an account, expired on their own and monitored only on demand.
- **Honest capabilities.** Every adapter declares what its source can observe on this platform. Expo Network cannot tell you about metering, so a metering condition stays `unknown` instead of pretending.
- **No lock-in, no bundling.** Adapters import no SDK. You pass in the one you already use.

Reach does not make requests on your behalf, retry them or queue them offline. It tells you what the evidence shows; what to do with it stays yours.

## Why there is no isOnline

Every source has a way to say `false` that does not mean offline, so there is no `isOnline` property, and a condition never becomes a Boolean on its own. `unknown` has to go somewhere, and where depends on the feature: an automatic upload can wait, and a button the user pressed can try. Write that choice where the feature decides, with the status in hand, instead of coercing it once for the whole application.

## Packages

| Package                                                             | What it is                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------- |
| [`@priemskiyyy/reach`](packages/core)                               | The runtime, the mocks and the adapter conformance suite |
| [`@priemskiyyy/reach-browser`](packages/adapters/browser)           | `navigator.onLine` and the Network Information API       |
| [`@priemskiyyy/reach-netinfo`](packages/adapters/netinfo)           | React Native NetInfo, iOS and Android                    |
| [`@priemskiyyy/reach-expo-network`](packages/adapters/expo-network) | Expo Network, iOS and Android                            |
| [`@priemskiyyy/reach-http`](packages/adapters/http)                 | Endpoint checks through your own HTTP client             |
| [`@priemskiyyy/reach-react`](packages/react)                        | A provider and hooks, with server rendering              |
| [`@priemskiyyy/reach-solid`](packages/solid)                        | A provider and primitives, with server rendering         |
| [`@priemskiyyy/reach-tanstack-query`](packages/tanstack-query)      | A condition as TanStack Query's online manager           |

Every package is ESM only, side-effect free and typed. The core has no dependencies.

## Examples

[Darkroom](examples) is a photo app that backs up to its own API, built on Reach. The [React tour](examples/react) runs a simulated phone and API inside the page, with a lab to break them, and can read your real browser instead. The [Expo app](examples/expo) reads NetInfo and checks a [fixture server](examples/server) over real HTTP.

```sh
pnpm install
pnpm build
pnpm dev
```

## Status

Everything is tested in process, against fakes modeled on each SDK's source and against each SDK's real types. Nothing has run on a device yet, and in a real browser only the example tour has: it takes Chromium offline and back through the browser adapter. [The decision record](docs/decisions.md) lists what that leaves unverified, and where the implementation departs from its specification.

## Documentation

- [The documentation site](https://priemskiyyy.github.io/reach/), built from [`docs/`](docs): guides, the adapters' capabilities, recipes for unknown, troubleshooting and the verification matrix.
- The README of each package above.
- [Decisions](docs/decisions.md) and the [runtime architecture](docs/internals/architecture.md).
- [Contributing](CONTRIBUTING.md), [support](SUPPORT.md) and [security](SECURITY.md).

## License

MIT
