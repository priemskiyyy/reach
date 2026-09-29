# Contributing

Use Node 22.18 or newer and the pnpm version in `package.json`. Run `pnpm install --frozen-lockfile`, then `pnpm check` before submitting a change. It builds every package, typechecks, lints, runs the lint rule probes, typechecks every documentation snippet, checks formatting and runs every test. `pnpm check:release` adds the documentation site, the release metadata, the packed consumer and the examples' builds, and is what a release must pass.

## Layout

- `packages/core`: the runtime, published as `@priemskiyyy/reach` with the `./mock` and `./testing` subpaths.
- `packages/adapters/*`: one package per source, published as `@priemskiyyy/reach-<name>`: `browser`, `netinfo` and `expo-network` observe the network, and `http` defines endpoint checks over the application's own client.
- `packages/react`: the React binding, a provider and hooks.
- `packages/solid`: the Solid binding, a provider and primitives.
- `packages/vue`: the Vue binding, a provider and composables.
- `packages/svelte`: the Svelte binding, a provider and utilities, built with `svelte-package` and checked with `svelte-check`.
- `packages/tanstack-query`: the bridge to TanStack Query's online manager.
- `examples/`: Darkroom, the example app. `shared` holds its domain, the simulated phone and API and the Tailwind recipes; `react` is the web tour, `expo` the React Native app, and `server` the fixture API the Expo app checks. `pnpm dev` starts the tour, and `pnpm test:examples` drives it in Chromium.
- `docs/`: the documentation site, built with VitePress: the guides, the decision record and the internals. `pnpm dev:docs` serves it, and `pnpm build:docs` then `pnpm verify:docs` checks every page, link, anchor and description. A new page goes in the sidebar in `docs/.vitepress/config.ts`.
- `scripts/`: the checks beyond the tests. `verify-lint-rules.mjs` proves each lint rule still rejects what it was written for, `verify-snippets.mjs` typechecks every `ts` and `tsx` example in the READMEs and docs against the built packages, `verify-packages.mjs` installs the packed tarballs into a consumer without native peers, and `measure-size.mjs` holds every entry to its gzipped budget. Each has been probed with a deliberately broken input, so keep that habit when changing one.

Runtime owners and helpers live in `utils/`, constants in `utils/constants/`, and shared contracts in `types/`, one type per file. Internal code belongs in each folder's `internal/` directory, so `utils/internal/` holds the helpers no consumer may import. The mock adapter lives in `mock/` and the conformance suite in `testing/`. Package roots export the supported public API explicitly, and no other file is a barrel. An adapter keeps its factory in `src/<name>.ts`, its mapping in `utils/`, and the provider's names and declared capabilities in `utils/constants/`.

## Code

Prefer descriptive names, early returns, guard clauses over compound conditions, `type` over `interface`, and exhaustive dispatch closed by `assertUnreachable`. Name a helper for what it returns, such as `readExpoPath`. No `enum`, `switch`, `any`, `as` casts or `as const`, the `void` operator, `readonly`, or the logical assignment operators. ESLint keeps a blank line around declarations, blocks and returns. Use `src/...` imports within each package. Avoid introducing a shared abstraction for a single use.

Types come before runtime checks. When a type can make a wrong call fail to compile, it does, and a `*.contracts.ts` file proves it with `@ts-expect-error` and a reason. Runtime checks remain only for what a type cannot say.

Reach never throws into its host from a callback. An adapter, a check, an evaluator or a listener that throws becomes an error in state or a diagnostic.

## Adapters

A network adapter maps one source's reports onto field observations and nothing more. The rules that are easiest to break:

- It is a plain `NetworkAdapter`: a `name`, an `available()` that probes the host cheaply, and an `open(context)`. The factory is cold: nothing is read or subscribed until `open`. A host without the source is unavailable, never an error.
- It takes the SDK the application set up, never configures it, and removes only the listeners it added.
- It never claims stronger evidence than its source gives. An ambiguous negative is `unknown` with `source-ambiguous`, never offline. A field the source cannot observe is `unsupported`.
- A read that finishes after subscribing reserves its place first with `context.reserve()`, so an event that arrives meanwhile wins.
- It runs `testNetworkAdapter` from `@priemskiyyy/reach/testing` in `src/conformance.test.ts`, tests against an in-process fake in `src/fake<Sdk>.fixture.ts`, and proves the real SDK's types fit in `src/<name>.contracts.ts`. Adapter tests import the core by its package name, so run `pnpm build` first.

## Testing

`pnpm test:unit` runs one vitest project per package, each with a `src` alias onto its own source. Tests sit beside their sources and are named after the specification case they prove, such as `T041`. A new test is watched failing once before it is trusted: when the implementation came first, break it on purpose and confirm the test goes red. Time is the test clock's, never a sleep; interleaving is tested with held reads and held checks.

Everything runs against fakes, except Chromium in the example tour. What a device or a real browser still has to verify is listed in [the verification matrix](docs/verification.md) and [the decision record](docs/decisions.md).

## Documentation

Write examples that compile as they stand: `pnpm verify:snippets` typechecks them. A name that stands for the reader's application, such as `client` or `network`, goes in `scripts/snippets.ambient.d.ts`. Mark a fence with `<!-- snippet: fragment -->` only when it cannot be a module, such as bare JSX. A compiling example proves its types, not its claims: check each statement about behavior against the source or a test.

## Commits

Commit in small, atomic steps with short conventional messages, such as `feat(netinfo): map netinfo states conservatively`. No em dashes, no agent names and no generated-by footers anywhere in the repository, including commit messages and changelog entries.
