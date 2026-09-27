---
description: "How Reach models the network: facts, the evidence behind each one, what a source can observe at all, and generations."
---

# Evidence, not a Boolean

Reach keeps a snapshot of facts about the network, and beside each fact the evidence it rests on. Nothing in the snapshot is guessed: a fact the source did not report is unknown.

## Facts

`network.state.get()` returns one frozen snapshot, replaced whenever something meaningful changes:

| Fact                      | Values                                                  |
| ------------------------- | ------------------------------------------------------- |
| `connection.status`       | `connected`, `disconnected` or `unknown`                |
| `connection.type`         | a transport, `none`, `mixed` or `unknown`               |
| `connection.transports`   | every link at once, or `null` when the set is not known |
| `internet.status`         | `online`, `offline` or `unknown`                        |
| `cost.metered`            | `true`, `false` or `null`                               |
| `cost.expensive`          | `true`, `false` or `null`                               |
| `preferences.constrained` | the user's low data mode: `true`, `false` or `null`     |
| `preferences.saveData`    | the user's data saver: `true`, `false` or `null`        |

Connection and internet are different facts. A phone joined to a hotel Wi-Fi is connected, and whether the internet works behind its sign-in page is a separate question. Metering, expense and a low data preference are three different things too: a metered link costs by the byte, an expensive one is cellular or a hotspot on iOS, and low data mode is a wish the user expressed.

## Evidence

Every fact has an entry in `state.evidence`:

```ts
const evidence = network.state.get().evidence["internet.status"];

if (evidence.status === "current") {
  console.info(evidence.basis, new Date(evidence.receivedAt));
}

if (evidence.status !== "current") {
  console.info(evidence.status, evidence.reason);
}
```

| Status        | Means                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| `current`     | the source reported it, on the basis it names                                 |
| `unknown`     | the source could not say, such as an ambiguous answer; never false or offline |
| `unsupported` | this source cannot observe it at all                                          |
| `stale`       | it was reported, but the source may have missed a change since                |
| `error`       | the source failed, so nothing it said still holds                             |

A current fact names its `basis`: a `browser-hint`, a `provider-report`, a `native-path`, a `native-validation`, `native-metering`, `native-expense`, a `user-data-preference` or a `custom` one. The bases are different kinds of evidence, not ranks on one scale, and Reach never turns one into another. NetInfo's reachability is its own request's report, not a verification, and a browser's `onLine` is a hint about a local link, not the internet.

Any other status carries a `reason`, a short code such as `unobserved`, `unsupported`, `source-ambiguous`, `source-unavailable` or `observation-gap`. The conditions built on a fact carry the same code.

## Capabilities

`network.capabilities` holds what the opened source says it can observe, one entry per fact. A supported fact names the bases it can report and whether its source reports `complete` changes, `partial` ones, or only reads the fact alongside other reports (`none`). An unsupported fact cannot claim a basis.

Capabilities are declared once per session, before any report, so an application can tell a fact that is unknown right now from one it will never learn on this platform. On the web, `internet.status` and `cost.metered` are unsupported; with Expo Network, every cost fact is.

## Generations

`state.generation` grows whenever the connection's status or type changes, and whenever the source says it may have missed changes. A new generation ends every endpoint check that started before it, and every endpoint result from before stops counting: a check that passed on Wi-Fi says nothing about the cellular link that replaced it.

`state.revision` grows with every meaningful change of the snapshot. Neither is a network identifier.

## Reports are complete and ordered

An adapter reports every fact at once. A fact it leaves out is unknown, never its previous value. Reports keep their order: a slow read reserves its place when it starts, so an event that arrives after the reservation wins over it, and a session that already ended cannot report at all.

## What follows

A [condition](conditions.md) reads these facts and says `met`, `unmet` or `unknown`. An [endpoint](endpoints.md) adds your own evidence: a check you define, with a lifetime.
