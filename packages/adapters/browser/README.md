# @priemskiyyy/reach-browser

The browser source for [Reach](../../core): `navigator.onLine` as a connection hint, and the Network Information API's connection type and data saver preference where the browser has them.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-browser
```

## Create a Reach

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";

const network = new Reach({ adapter: browser() });

network.start();
```

Creating the adapter reads nothing. It uses `window` when the runtime opens. Without one, such as in a server render, the adapter is unavailable: the runtime starts with every fact `unsupported`, for the reason `source-unavailable`, instead of failing.

## What it reports

| Fact                   | Source                                      | Basis                  |
| ---------------------- | ------------------------------------------- | ---------------------- |
| `connection.status`    | `navigator.onLine`, `online` and `offline`  | `browser-hint`         |
| `connection.type`      | `navigator.connection.type`, if present     | `browser-hint`         |
| `preferences.saveData` | `navigator.connection.saveData`, if present | `user-data-preference` |

Every other fact is `unsupported`, so a condition on it stays `unknown`:

- `onLine` is a hint about a local link, never internet. `internet.status` is unsupported: check an endpoint for that.
- An effective type such as `4g` is a speed estimate, never a radio or a transport, and is not read.
- A data saver preference is the user's wish, never a cost. `cost.metered` stays unsupported.
- Each Network Information property is detected on its own when the session opens.

## Page lifecycle

Hiding the page (`pagehide`) and freezing it (`freeze`) are observation gaps: every fact becomes stale and the generation advances, so endpoint results from before are not trusted after. Showing (`pageshow`) and resuming (`resume`) the page read everything afresh.

## Options

| Option   | Default  | Meaning                                                 |
| -------- | -------- | ------------------------------------------------------- |
| `target` | `window` | The window to observe, such as an iframe's or a test's. |

## Behavior

- Ownership is `owned`: the adapter adds its own listeners and removes every one of them when the session ends.
- `refresh()` reads the browser again.
- `native` is `{ connection }`, the Network Information object or `null`.

## Tests

The tests run in jsdom, against a fake window that dispatches real DOM events, and through the shared adapter conformance suite. No real browser has run them yet.
