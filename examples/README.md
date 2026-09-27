# Example applications

Every example is the same product: Darkroom, a photo app that backs up to your own API. It asks Reach what the network is and on what evidence, whether the API answers for the signed-in account, and decides with conditions that are met, unmet or unknown. Automatic backup waits on unknown, because nobody asked for it; Back up now tries, because somebody did.

Run `pnpm build` from the repository root first. The examples import the built public packages.

| Example                  | Run                              | What it shows                                                                                                                            |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [React](react)           | `pnpm dev`                       | The full tour: the app, every fact with its evidence, conditions and decisions, the API endpoint, a lab, the network log and a timeline. |
| [Expo](expo)             | `pnpm --filter example-expo dev` | A React Native Darkroom over NetInfo, checking the fixture server over real HTTP, with every fact unsupported on the web.                |
| [Fixture server](server) | `pnpm dev:server`                | Darkroom's API over HTTP on port 4401, with a control endpoint to break it.                                                              |

The React tour creates and starts Darkroom outside React, publishes its Reach with `ReachProvider`, and reads it with `useNetwork`, `useCondition` and `useEndpoint`. A switch between the simulated phone and this browser replaces the runtime, because a disposed Reach never starts again.

## Shared code

`examples/shared` is the `example-shared` workspace package:

- `darkroom/` holds the domain: the accounts and the camera roll, the one Reach with its `http()` endpoint scoped to the account, the conditions, what each backup decides for met, unmet and unknown, and the runtime that backs photos up and keeps the timeline.
- `phone/` is a phone's network stack inside the page and a real adapter over it, which passes `testNetworkAdapter`. `backend/` is your API and its client, with a network log.
- `formatting/` says every fact, reason, check and run in words; a missing fact is unknown, never false.
- `ui/` holds the Tailwind theme and the `class-variance-authority` recipes in slate and sky.

The web tour runs everything inside the page, so it needs no device, no server and no account anywhere.

## Fixture server

`pnpm dev:server` builds and starts `examples/server` on port 4401. It answers `GET /api/health` and `PUT /api/photos/:id` from the same backend the tour runs in the page, for the account in the `x-darkroom-account` header, and changes how it answers on `POST /api/control`, validating every input with Zod. A client that hangs up aborts its request, as Reach does at a check's deadline. The permissive CORS and the open control endpoint are there for local development only.

## Tests

`pnpm test:unit` runs the `example-shared`, `example-react` and `example-server` projects with everything else. `pnpm test:examples` builds the tour and drives it in Chromium with Playwright at 375 and 1280 px, including Chromium's own offline mode reaching the real browser adapter. The Expo app is typechecked by `pnpm lint:typescript` and bundled for web by `pnpm check:release`; nothing here runs it on a device.
