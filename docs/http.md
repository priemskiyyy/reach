---
description: "HTTP endpoint checks through your own client with @priemskiyyy/reach-http: a request that resolves with parsed data, and a typed test."
---

# HTTP endpoints

`http()` from `@priemskiyyy/reach-http` defines an endpoint checked through your own HTTP client. Your client keeps what it already owns: the address, authentication, headers, caching and parsing. Reach owns when the check runs, its deadline and what its answer means.

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
    }),
  },
});

network.start();
```

`test` is typed by what `request` resolves with, so reading a field the answer does not have fails to compile. Without a test, any answer passes.

## With fetch

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

console.info(readHealth);
```

Parse the body at this boundary with your schema library if you have one; the example application uses Zod.

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

- `signal` aborts at the deadline, when a network or scope change supersedes the check, and on disposal. Pass it on, so an abandoned check stops sending, and test `signal.aborted` between the steps of a request in several steps, such as fetching a token first.
- `scope` is the key of a scoped endpoint, such as the signed-in account, or `null`.

Anything `request` throws is a failed check, because nothing tells a preparation error apart from a network error. Keep what can fail before a request is sent out of it: while there is no signed-in account or no token, give the endpoint a `scope` whose key is `null`. Its checks are then refused, and it stays unknown instead of failing.

## The health endpoint

- Answer with a small, agreed status and a response nobody caches, such as `204` or `{ "status": "ready" }` with `Cache-Control: no-store`.
- A service worker can answer for your server, and `no-store` does not stop it. Exclude the health route from your service worker.
- A captive portal answers with its sign-in page or a redirect. Your client should fail on it, with `redirect: "error"` or a parse that rejects HTML, and the check fails as `request-failed`. Reach does not call it a captive portal: nothing in a failed request proves one.
- CORS or a content security policy that blocks the request fails it the same way. That says nothing about your server's health.
- One health check covers one service. A healthy API says nothing about your upload storage.
- Reach adds nothing to your request: no nonce, no query string, no header.

## Abort in practice

Node's `fetch` and browsers abort a request when its signal aborts, and the tests verify it over a real loopback connection. Some React Native clients keep a request going after abort. Reach does not depend on it: the check still times out at its deadline and its late answer is ignored, but the request holds one of `maxOutstandingChecks` until it settles. See [troubleshooting](troubleshooting.md#why-did-capacity-become-exhausted-after-ignored-aborts).
