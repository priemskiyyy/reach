# The changing-world fuzz

A fake operating system (`createWorld.fixture.ts`) owns the truth: which path exists, whether the internet is reachable, whether it is metered. A script changes that truth between steps, with or without telling the open session, and moves the application between foreground and background, the clocks forward, a refresh forward or held, checks to pass or fail, and leases and disposal. The world logs every report it delivers.

The oracles compare Reach with that log, never with Reach's own model: what the world reported, in the order Reach must apply it, on the clocks that stood at the moment of the call. This is how a resume that skipped a check on a stale `offline` was found. It is a fake world, not a device: it proves Reach's decisions against what a fake source did, and nothing about what a real SDK does.

## Run it

```sh
pnpm test:unit                     # a small, fixed-seed run, with the rest of the suite
pnpm test:world                    # 100000 scripts, plain and strict
WORLD_RUNS=2000 WORLD_SEED=7 WORLD_STEPS=40 pnpm exec vitest run --project core packages/core/src/world/world.fuzz.test.ts
```

| Variable       | Effect                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `WORLD_RUNS`   | how many scripts, from the seed upward                                                         |
| `WORLD_SEED`   | the first seed, so a failure names the seed that shows it                                      |
| `WORLD_STEPS`  | steps per script                                                                               |
| `WORLD_STRICT` | `1` lets the world also change silently in the foreground                                      |
| `WORLD_IGNORE` | class names to skip, comma separated, on top of the documented limits                          |
| `WORLD_SURVEY` | `1` prints every class with a minimal replay, documented limits included, instead of asserting |
| `WORLD_REPLAY` | a script printed by a failure, run once and its violations printed                             |

A failure prints each class once with the first seed that showed it and a script reduced until every step is needed. Paste the script into `WORLD_REPLAY`, or turn it into a test beside `world.findings.test.ts`.

## Documented limits

Classes the fuzz finds that Reach documents are skipped by name in `documentedLimits.fixture.ts`, each with the sentence that documents it. A class that is not listed fails the run.

- `state.error-without-world-error`: a failed or timed-out `refresh()` marks every fact `error` even when the subscription held a good value, and a late answer is dropped. Cited in `docs/lifecycle.md`.
- `condition.online` and `condition.offline`: the same refresh, seen through a condition over the facts it marked `error`, which read unknown.

## Add an oracle

1. Derive the expectation from `world.log` or `world.truth()`, never from `reach.state` or any value Reach computed. If the world cannot say it, log it: add a `WorldEntry` kind in `types/WorldEntry.ts` and write it in `createWorld.fixture.ts`.
2. Put the check in the `check*.fixture.ts` file it belongs to, or a new one called from `checkOracles.fixture.ts`, and name its class with `flagViolation`. A class name is `area.what-went-wrong`.
3. Run `WORLD_RUNS=100000 pnpm exec vitest run --project core packages/core/src/world/world.fuzz.test.ts`. If the oracle fires, either Reach is wrong, so fix it and add a short script to `world.findings.test.ts`, or the oracle is, so correct it. Break the code on purpose once and watch the oracle go red before you trust it.
4. A class that is Reach's documented behavior goes in `documentedLimits.fixture.ts` with a citation. Never list one to make a run pass.

A new kind of step goes in `types/Step.ts`, `generateScript.fixture.ts` and `applyStep.fixture.ts`; the exhaustive check in `applyStep` fails to compile until all three agree.
