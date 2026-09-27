---
description: "Darkroom, a photo app that backs up to its own API, built on Reach: a web tour with a lab, and an Expo app over NetInfo."
---

# Example application

Darkroom is a small photo app that backs up to your own API. It asks Reach what the network is and on what evidence, whether the API answers for the signed-in account, and decides with conditions that can be unknown.

```sh
pnpm install
pnpm build
pnpm dev
```

## The web tour

The React example runs a simulated phone and the API inside the page, with real Reach code between them. It walks through six sections:

1. **Back up what the network allows.** Take a photo and it backs up on its own while `all(api.available, unmetered)` is met. Beside the app, the latest check says what Reach knows about the API for this account, and whether that answer still counts.
2. **Every fact names its evidence.** The eight facts, each with its status, basis and declared capability. Switch the source to This browser and the real `browser()` adapter takes over: internet turns unsupported, and so does metering, so automatic backup waits instead of guessing.
3. **Met, unmet or unknown.** Each condition with its reasons, and what each feature decides: automatic backup waits on unknown, Back up now tries.
4. **One check, however many ask.** Two callers join one check and one request. Watchers read the endpoint without sending anything. Invalidate drops an answer without checking again.
5. **Break the network.** Move the phone to a hotspot, a hotel Wi-Fi, cellular or no signal; turn on Low Data Mode; make its network service fail. Slow the API past its timeout, take it down, degrade it, or make its client ignore cancel.
6. **Watch it happen.** Reach's diagnostics, which never carry an account.

## The Expo app

The Expo example reads the real phone through NetInfo and checks a fixture server over HTTP, with `AppState` as the activity source. On the web, NetInfo is unavailable, so every fact is unsupported and the app says so instead of failing.

## Where the code is

The source is in [`examples/`](https://github.com/priemskiyyy/reach/tree/main/examples) of the repository. The boundary is `examples/shared/darkroom/network/createDarkroomReach.ts`: everything it constructs is real Reach, and only the phone and the API behind it are simulated.
