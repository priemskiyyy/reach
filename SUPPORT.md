# Getting help

Start with the README of the package you use: [the core](packages/core), [each adapter](packages/adapters), [the React binding](packages/react) and [the TanStack Query bridge](packages/tanstack-query). [The decision record](docs/decisions.md) says where Reach departs from its specification and what has not been verified on a device yet.

For a bug report, include:

- The smallest example that reproduces the issue, ideally over the mock network and mock endpoint from `@priemskiyyy/reach/mock`.
- Reach, adapter, provider SDK, framework and runtime versions, and the platform: browser, Node, React Native or Expo, with the device and operating system.
- The Reach options involved: the adapter, the endpoints, `activity`, `timeouts` and `maxOutstandingChecks`.
- The network state in question, with its `evidence`, from `reach.state.get()`.
- The endpoint state, from `reach.endpoint(name).state.get()`, and the `code` of a `ReachError` it holds.
- The diagnostic snapshot from `reach.diagnostics.get()`, and its events around the problem if you can record them.
- Whether it happens before `start()`, around a return to the foreground, across a scope change or after `dispose()`.

Use [GitHub issues](https://github.com/priemskiyyy/reach/issues) for reproducible bugs and feature requests. Report a security issue privately instead, as [SECURITY.md](SECURITY.md) describes. Remove URLs with credentials, tokens and account identifiers from examples and logs. Diagnostic events never carry a scope key, so they are safe to share as they are.

If a source reports something that looks wrong, check first what the provider SDK itself answers without Reach. Reach maps a report conservatively; it cannot recover what the source never said.

See [CONTRIBUTING.md](CONTRIBUTING.md) to run the tests or propose a change.
