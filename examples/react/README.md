# Darkroom, a Reach example

Darkroom is a small photo app that backs up to your own API. It asks [Reach](../../README.md) what the network is, on what evidence, and whether the API answers, and it decides with conditions that are met, unmet or honestly unknown. The phone and the API are simulated inside the page; the adapters, the endpoint and every condition are real Reach code. Nothing leaves your browser.

```sh
pnpm install
pnpm build
pnpm --filter example-react dev
```

The packages are linked from the workspace, so build them first. The boundary file is `../shared/darkroom/network/createDarkroomReach.ts`: everything it constructs is real Reach, and only the phone and the API behind it are simulated.

## The tour

The page walks through six sections, each with a "Try this" hint:

1. **Back up what the network allows.** Darkroom is one app: an account switcher, the network source, the automatic backup strip, the photos, Take photo, Back up now and a status bar read from Reach's diagnostics. Automatic backup runs on `all(api.available, unmetered)`. Beside the app, the latest check says what Reach knows about the API for the signed-in account and whether that answer still counts.
2. **Every fact names its evidence.** Each of the eight facts shows its value, its evidence status, what it rests on and what the source declared it can observe. Switch to This browser and the real `browser()` adapter takes over: internet is unsupported, because a browser only hints at a connection, and metering cannot be told at all, so automatic backup waits instead of guessing.
3. **Met, unmet or unknown.** Every condition Darkroom decides with, how it is built, and its reasons in words. The decisions panel shows what each feature does with each status: automatic backup waits on unknown, because nobody asked for it, and Back up now tries, because somebody did.
4. **One check, however many ask.** The API endpoint with its freshness second by second. Check twice at once and both callers join one check, one request in the network log. Invalidate drops the answer without checking again. Add watchers and each reads the API with `useEndpoint`, and none of them sends a request or adds a monitor: reading never checks.
5. **Break the network.** Move the phone to a hotspot, a hotel Wi-Fi behind a sign-in page, cellular or no signal; turn on Low Data Mode or make its network service fail. Slow the API past its 3 second timeout, take it offline or degrade it, or make its client ignore cancel, so a timed-out check runs on detached and its late answer changes nothing. The network log beside the lab lists every request your API received.
6. **Watch it happen.** Reach's diagnostics stream: leases, sessions, observations and checks, with the counters. It never carries an account or a value.

**Reset demo** in the header starts over.

## How it fits together

| File                                                     | Role                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                                           | Starts Darkroom once, outside React, and renders it.                                                                 |
| `src/Application.tsx`                                    | Publishes the Reach with `ReachProvider`, owns every side effect, and replaces the runtime on a switch of source.    |
| `../shared/darkroom/runtime/startDarkroom.ts`            | Creates the phone, the API, the account, the roll and the first runtime.                                             |
| `../shared/darkroom/runtime/createDarkroomRuntime.ts`    | One Reach and what Darkroom does with it: automatic backup, Back up now, and a recheck after a failed upload.        |
| `../shared/darkroom/network/createDarkroomReach.ts`      | The boundary file: the adapter, the `http()` endpoint scoped to the account, its monitoring and the activity source. |
| `../shared/darkroom/network/createDarkroomConditions.ts` | Every condition Darkroom decides with.                                                                               |
| `../shared/darkroom/backup/constants/decisions.ts`       | What each feature does with met, unmet and unknown.                                                                  |
| `../shared/phone/createSimulatedPhone.ts`                | The phone's network stack and a real adapter over it, which passes `testNetworkAdapter`.                             |
| `../shared/backend/createPhotosBackend.ts`               | Your API and its client: latency, an outage, a degraded mode, the phone's route, and the network log.                |
| `../shared/formatting/formatReason.ts`                   | A condition's reason in plain words; unknown never reads as false or offline.                                        |
| `src/components/`                                        | The app card, the latest check, evidence, conditions and decisions, the endpoint, the lab and the timeline.          |
| `src/Application.test.tsx`                               | Every flow driven through the buttons, with a fresh runtime per test.                                                |

The hooks come from `@priemskiyyy/reach-react`: `useNetwork` for the facts, `useCondition` for conditions and decisions, and `useEndpoint` for the API. Styling is Tailwind with a few `class-variance-authority` recipes in `../shared/ui/`, and icons come from Phosphor, as in the sibling libraries' examples.

## Using a real source

Replace the simulated phone with `browser()` on the web, or with `netInfo()` or `expoNetwork()` in React Native, and give `http()` a `request` over your own API client. Nothing else in the app changes; the Expo example does exactly that.

## Tests

`pnpm test:unit` runs the example's tests in jsdom against the built packages. They start Darkroom the way the page does and drive every flow through the buttons: a photo backing up on its own, automatic backup pausing on cellular while Back up now still sends, a hotel Wi-Fi leaving internet unknown while the API's failed check refuses Back up now, signing out, two callers sharing one request, Back up now trying on an invalidated API, a failed upload that rechecks instead of retrying, the browser source that cannot tell metering, watchers that create no demand, and a timed-out check left detached by a client that ignores cancel.

`pnpm test:examples` builds the packages and drives the built page in Chromium with Playwright (`../darkroom.spec.ts`). At 375 and 1280 px wide a photo backs up with no page errors and no horizontal scroll; it also checks the cellular pause, the hotel Wi-Fi, one request for two callers, and that Chromium's own offline mode reaches the real browser adapter. It is not part of `pnpm check`.
