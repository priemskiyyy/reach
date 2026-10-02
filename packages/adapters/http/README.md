# @priemskiyyy/reach-http

HTTP endpoint checks for [Reach](https://github.com/priemskiyyy/reach/tree/main/packages/core), through your own client. You give `http()` one function that asks your service whether it is ready and resolves with the parsed answer, and a test that reads that answer with its type. Your client keeps everything it already owns: the address, authentication, headers, caching and parsing.

## Installation

```sh
pnpm add @priemskiyyy/reach @priemskiyyy/reach-http
```

## Define an endpoint

```ts
import { Reach } from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

const network = new Reach({
  adapter: browser(),
  endpoints: {
    api: http({
      request: ({ signal }) => client.health.get({ signal }),
      test: ({ status }) => status === "ready",
      staleAfter: 30_000,
      timeout: 3_000,
      monitoring: { on: ["start", "network-change", "foreground"] },
    }),
  },
});

const { observation } = await network.endpoint("api").check();
```

`test` is typed by what `request` resolves with, so reading a field the answer does not have fails to compile. Without a test, any answer passes.

With plain `fetch`, the request is where you decide what an answer means:

```ts
import type { ProbeContext } from "@priemskiyyy/reach";

type Health = { status: "ready" | "degraded" };

const readHealth = async ({ signal }: ProbeContext): Promise<Health> => {
  const response = await fetch("https://api.example.com/health/ready", {
    signal,
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
  });

  if (!response.ok) {
    throw new Error(`The health endpoint answered ${response.status}.`);
  }

  const health: Health = await response.json();

  return health;
};
```

## Outcomes

| `request` and `test` do                         | The check                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| resolve, and `test` answers `true` or is absent | `pass`, response `received`: the endpoint is `available`                           |
| resolve, and `test` answers `false`             | `fail`, response `received`, reason `test-failed`                                  |
| `request` throws or rejects                     | `fail`, response `unknown`, reason `request-failed`                                |
| outlive `timeout`, the test included            | `fail`, reason `timeout`, and `signal` aborts                                      |
| `test` throws                                   | a probe error: `check()` rejects with `PROBE_ERROR`, and the previous result stays |
| a connection or scope change arrives first      | superseded: nothing is committed, and `signal` aborts                              |

A client rejects for a refused connection and for an error status alike, so a rejected request never claims a response arrived. Endpoint state keeps the verdict, never the data.

## The request

`request({ signal, scope })` receives the check's context:

- `signal`, which aborts at the deadline, when a network or scope change supersedes the check, and on disposal. Pass it on, so an abandoned check stops sending, and test `signal.aborted` between the steps of a request in several steps, such as fetching a token first.
- `scope`, the key of a scoped endpoint, such as the signed-in account, or `null`.

Anything `request` throws is a failed check, because nothing tells a preparation error apart from a network error. Keep what can fail before a request is sent out of it: while there is no signed-in account or no token, give the endpoint a `scope` whose key is `null`. Its checks are then refused and it stays unknown, instead of failing.

## Options

`http()` takes every option of an endpoint definition except `check`, and adds two:

| Option       | Default           | Meaning                                                           |
| ------------ | ----------------- | ----------------------------------------------------------------- |
| `request`    | required          | Sends one check through your client and resolves with the answer. |
| `test`       | any answer passes | Whether the answer means the endpoint is available.               |
| `staleAfter` | required          | Milliseconds a result stays current.                              |
| `timeout`    | 5,000             | Milliseconds one check may take, the test included.               |
| `scope`      | none              | An observable key, such as the signed-in account.                 |
| `monitoring` | none              | When a monitored endpoint checks on its own.                      |

## The health endpoint

- Answer with a small, agreed status and a response nobody caches, such as `204` or `{ "status": "ready" }` with `Cache-Control: no-store`. A service worker can still answer for your server; exclude the health route from it.
- One health check covers one service. A healthy API says nothing about your upload storage: define a separate endpoint for it, or handle the upload's own failure.
- Reach adds nothing to your request: no nonce, no query string, no header. Add one in your client if you need to tell a cached or captive answer from a live one.

## Tests

The tests run against an in-process fake client. No request is sent over a network from this repository.
