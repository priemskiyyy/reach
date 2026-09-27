// Typechecked, never run: the test reads the data the request parses, and
// the definition fits wherever an endpoint does.
import { Reach } from "@priemskiyyy/reach";
import type { EndpointDefinition } from "@priemskiyyy/reach";
import { createMockNetwork } from "@priemskiyyy/reach/mock";

import { http } from "src/http";

type Health = { status: "ready" | "degraded" };

declare const getHealth: (options: { signal: AbortSignal }) => Promise<Health>;

export const api: EndpointDefinition = http({
  request: ({ signal }) => getHealth({ signal }),
  test: ({ status }) => status === "ready",
  staleAfter: 30_000,
});

export const reach = new Reach({
  adapter: createMockNetwork().adapter,
  endpoints: { api },
});

export const handle = reach.endpoint("api");

export const asynchronousTest = http({
  request: ({ signal }) => getHealth({ signal }),
  test: async ({ status }) => Promise.resolve(status === "ready"),
  staleAfter: 30_000,
});

export const missingField = http({
  request: ({ signal }) => getHealth({ signal }),
  // @ts-expect-error The test reads the parsed data, so a field it lacks fails to compile.
  test: ({ ready }) => ready,
  staleAfter: 30_000,
});

export const notBoolean = http({
  request: ({ signal }) => getHealth({ signal }),
  // @ts-expect-error The test answers whether the endpoint is available, nothing else.
  test: ({ status }) => status,
  staleAfter: 30_000,
});

// @ts-expect-error How long a result stays current is the application's decision.
export const withoutStaleAfter = http({
  request: ({ signal }) => getHealth({ signal }),
});

export const secondCheck = http({
  request: ({ signal }) => getHealth({ signal }),
  staleAfter: 30_000,
  // @ts-expect-error The request is the check; a second one is never taken.
  check: () => ({ verdict: "pass", response: "received" }),
});
