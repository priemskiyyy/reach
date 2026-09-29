# Agent guide

Reach is an application-owned model of network evidence, with source adapters
and optional endpoint checks. Its siblings are Flare, Pulse, Silo, Simulcast,
Switchboard and Trace, and it follows their conventions. Before changing code,
read `CONTRIBUTING.md` for layout and style, `docs/internals/architecture.md`
for the invariants, `docs/decisions.md` for where the implementation departs
from the specification, and the tests beside the file you touch.

- The model: one `Reach` per application over one network `adapter` and
  optional named `endpoints`. The core owns leases, sessions, the order of
  reports, evidence, generations, conditions, checks, freshness, monitoring
  and diagnostics. An adapter maps one source's reports onto field
  observations and nothing more. The core never branches on an adapter name.
- Evidence is never upgraded. A missing fact is unknown, never `false`. A
  browser hint is never internet, a provider report is never verification, an
  ambiguous negative tuple is never offline, and one endpoint's failure is
  never the network's.
- Provider SDKs are injected by the application and typed structurally, so an
  adapter package imports no SDK, no `react-native` and no test runner. A
  `*.contracts.ts` file proves the real SDK's types fit.
- Reach never throws into the host application from a callback. Only
  misconfiguration and use after disposal throw, as a `ReachError`: invalid
  durations, an endpoint name that was never defined, a binding hook outside
  its provider, and `start()` after `dispose()`.
- Style: grouped options, `type` over `interface`, no `enum`, no `switch`, no
  `any`, no `as` casts or `as const`, no non-null `!`, no `void` operator, no
  `??=`, `||=` or `&&=`, no `readonly`, braces on every `if`, no `else` after
  a `return`, `assertUnreachable` at union dispatch, early returns and guard
  clauses over compound conditions, a blank line around declarations, blocks
  and returns, arrow functions exported one per file, `src/...` imports,
  re-exports only at package entry points, JSDoc with an example on public
  exports. Every package keeps `types/`, `utils/` and `utils/constants/`
  folders, with internal types under `types/internal/`. Durations are
  milliseconds without a unit suffix. Comments only say what the code cannot:
  a provider quirk or a reason. No em dashes in code, comments or prose.
- Style carve-outs, each with a comment saying why, and nothing wider than
  these: an overload pair where a mapped type erases which value belongs to
  which key, as in `readConditionSources`, and the overloaded hooks of the
  React, Solid, Vue and Svelte bindings, whose selector overloads need
  function declarations. The Svelte binding imports by relative path, since
  `svelte-package` rewrites no aliases. There
  are no ESLint disables; inline configuration is switched off.
- Tests are named after the specification case they prove, such as `T041`. A
  new test is watched failing before it is trusted. When the implementation
  came first, break it on purpose and confirm the test goes red.
- Verify with `pnpm check`. Commit in small, atomic steps with short
  conventional messages, and never add an agent attribution trailer or footer
  anywhere.
