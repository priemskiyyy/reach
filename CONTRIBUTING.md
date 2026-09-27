# Contributing

Use Node 22.18 or newer and the pnpm version in `package.json`. Run `pnpm install --frozen-lockfile`, then `pnpm check` before submitting a change. It builds every package, typechecks, lints, runs the lint rule probes, checks formatting and runs every test.

## Layout

- `packages/core`: the runtime, published as `@priemskiyyy/reach` with the `./mock` and `./testing` subpaths.
- `packages/adapters/*`: one package per source, published as `@priemskiyyy/reach-<name>`: `browser`, `netinfo` and `expo-network` observe the network, and `http` defines endpoint checks over the application's own client.
- `packages/react`: the React binding, a provider and hooks.
- `packages/tanstack-query`: the bridge to TanStack Query's online manager.
- `docs/`: the decision record and the internals.
- `scripts/verify-lint-rules.mjs`: proves each lint rule still rejects what it was written for.

Runtime owners and helpers live in `utils/`, constants in `utils/constants/`, and shared contracts in `types/`, one type per file. Internal code belongs in each folder's `internal/` directory, so `utils/internal/` holds the helpers no consumer may import. The mock adapter lives in `mock/` and the conformance suite in `testing/`. Package roots export the supported public API explicitly, and no other file is a barrel. An adapter keeps its factory in `src/<name>.ts`, its mapping in `utils/`, and the provider's names and declared capabilities in `utils/constants/`.

## Code

Prefer descriptive names, early returns, guard clauses over compound conditions, `type` over `interface`, and exhaustive dispatch closed by `assertUnreachable`. Name a helper for what it returns, such as `readExpoPath`. No `enum`, `switch`, `any`, `as` casts or `as const`, the `void` operator, `readonly`, or the logical assignment operators. ESLint keeps a blank line around declarations, blocks and returns. Use `src/...` imports within each package. Avoid introducing a shared abstraction for a single use.

Types come before runtime checks. When a type can make a wrong call fail to compile, it does, and a `*.contracts.ts` file proves it with `@ts-expect-error` and a reason. Runtime checks remain only for what a type cannot say.

Reach never throws into its host from a callback. An adapter, a check, an evaluator or a listener that throws becomes an error in state or a diagnostic.

## Adapters

A network adapter maps one source's reports onto field observations and nothing more. The rules that are easiest to break:

- It is a plain `NetworkAdapter`, a `name` and an `open(context)`. The factory is cold: nothing is read or subscribed until `open`.
- It takes the SDK the application set up, never configures it, and removes only the listeners it added.
- It never claims stronger evidence than its source gives. An ambiguous negative is `unknown` with `source-ambiguous`, never offline. A field the source cannot observe is `unsupported`.
- A read that finishes after subscribing reserves its place first with `context.reserve()`, so an event that arrives meanwhile wins.
- It runs `testNetworkAdapter` from `@priemskiyyy/reach/testing` in `src/conformance.test.ts`, tests against an in-process fake in `src/fake<Sdk>.fixture.ts`, and proves the real SDK's types fit in `src/<name>.contracts.ts`. Adapter tests import the core by its package name, so run `pnpm build` first.

## Testing

`pnpm test:unit` runs one vitest project per package, each with a `src` alias onto its own source. Tests sit beside their sources and are named after the specification case they prove, such as `T041`. A new test is watched failing once before it is trusted: when the implementation came first, break it on purpose and confirm the test goes red. Time is the test clock's, never a sleep; interleaving is tested with held reads and held checks.

Everything runs against fakes. Real device, browser and packed consumer verification is listed as missing in [the decision record](docs/decisions.md).

## Commits

Commit in small, atomic steps with short conventional messages, such as `feat(netinfo): map netinfo states conservatively`. No em dashes, no agent names and no generated-by footers anywhere in the repository, including commit messages and changelog entries.
