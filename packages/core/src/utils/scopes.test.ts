import { expect, test, vi } from "vitest";

import { createMockEndpoint } from "src/mock/createMockEndpoint";
import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import type { MonitorTrigger } from "src/types/MonitorTrigger";
import type { ReachDiagnosticEvent } from "src/types/ReachDiagnosticEvent";
import { ValueStore } from "src/utils/internal/observable/ValueStore";
import { CONNECTED_WIFI, settle } from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

const createScopedReach = (initial: string | null, on?: MonitorTrigger[]) => {
  const scope = new ValueStore<string | null>(initial);

  const probe = createMockEndpoint({
    staleAfter: 30_000,
    scope: scope.observable,
    ...(on === undefined ? {} : { monitoring: { on } }),
  });

  const clock = createTestClock();

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock,
    endpoints: { api: probe.definition },
  });

  return { reach, probe, scope, clock, api: reach.endpoint("api") };
};

test("T125 an unscoped endpoint checks with no scope", async () => {
  const probe = createMockEndpoint({ staleAfter: 1_000 });

  const reach = new Reach({
    adapter: createMockNetwork().adapter,
    clock: createTestClock(),
    endpoints: { api: probe.definition },
  });

  reach.start();
  reach.endpoint("api").check();

  expect(probe.calls[0]?.context.scope).toBeNull();
  expect(reach.endpoint("api").state.get().scope).toBe("unscoped");
});

test("the check runs for the scope key it captured", () => {
  const { reach, probe, api } = createScopedReach("account-a");

  reach.start();
  api.check();

  expect(probe.calls[0]?.context.scope).toBe("account-a");
});

test("T126 without a scope key a check is refused and the endpoint is unknown", async () => {
  const { reach, probe, api } = createScopedReach(null);

  reach.start();

  await expect(api.check()).rejects.toMatchObject({
    code: "SCOPE_UNAVAILABLE",
  });
  expect(probe.calls).toHaveLength(0);
  expect(api.state.get().scope).toBe("unavailable");
  expect(api.available.get().reasons).toEqual([
    { code: "scope-unavailable", field: null, endpoint: "api" },
  ]);
});

test("T126 monitoring skips while there is no scope key", () => {
  const { reach, probe, api } = createScopedReach(null);

  reach.start();
  api.monitor();

  expect(probe.calls).toHaveLength(0);
  expect(reach.diagnostics.get().counters.skippedChecks).toBe(1);
});

test("T127 T131 switching accounts ends the old account's check and clears its history", async () => {
  const { reach, probe, scope, api } = createScopedReach("account-a");

  reach.start();

  const first = api.check();

  probe.pass();
  await first;

  const pending = api.check();

  scope.update("account-b");

  await expect(pending).rejects.toMatchObject({ code: "SUPERSEDED" });
  expect(api.state.get()).toEqual({
    status: "unknown",
    freshness: "never",
    checking: false,
    scope: "available",
    lastObservation: null,
    lastAttempt: null,
    error: null,
  });

  probe.calls[1]?.resolve({ verdict: "pass", response: "received" });
  await settle();

  expect(api.state.get().freshness).toBe("never");
});

test("T129 a new token inside the same account is not observed until the application invalidates or changes the key", async () => {
  const { reach, probe, scope, api } = createScopedReach("account-a");

  reach.start();

  const first = api.check();

  probe.pass();
  await first;

  // The application refreshed the account's token, which Reach cannot see.
  expect(api.state.get().status).toBe("available");

  api.invalidate();
  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "stale",
  });

  // A key with an epoch in it is a new scope, and the old account's history goes with it.
  scope.update("account-a#2");
  expect(api.state.get()).toMatchObject({
    status: "unknown",
    freshness: "never",
    lastObservation: null,
  });
});

test("T128 T130 losing the scope during a check makes it obsolete at once", () => {
  const { reach, probe, scope, api } = createScopedReach("account-a");

  reach.start();
  api.check().catch(() => {});

  const context = probe.calls[0]?.context;

  scope.update(null);

  expect(context?.signal.aborted).toBe(true);
});

test("T132 returning to an earlier account never restores its old pass", async () => {
  const { reach, probe, scope, api } = createScopedReach("account-a");

  reach.start();

  const first = api.check();

  probe.pass();
  await first;
  scope.update("account-b");
  scope.update("account-a");

  expect(api.state.get().freshness).toBe("never");
});

test("an idle endpoint never shows another scope's history", async () => {
  const { reach, probe, scope, api } = createScopedReach("account-a");
  const lease = reach.start();
  const first = api.check();

  probe.pass();
  await first;
  lease.release();
  scope.update("account-b");

  expect(api.state.get().lastObservation).toBeNull();
});

test("T133 a scope change checks only when the policy asks for it", async () => {
  const without = createScopedReach("account-a");

  without.reach.start();
  without.api.monitor();
  without.probe.pass();
  await settle();
  without.scope.update("account-b");
  without.clock.advance(60_000);

  expect(without.probe.calls).toHaveLength(1);

  const withTrigger = createScopedReach("account-a", ["start", "scope-change"]);

  withTrigger.reach.start();
  withTrigger.api.monitor();
  withTrigger.probe.pass();
  await settle();
  withTrigger.scope.update("account-b");

  // Automatic starts keep their minimum interval, whatever triggers them.
  expect(withTrigger.probe.calls).toHaveLength(1);

  withTrigger.clock.advance(1_000);
  expect(withTrigger.probe.calls).toHaveLength(2);
  expect(withTrigger.probe.calls[1]?.context.scope).toBe("account-b");
});

test("a throwing scope makes the endpoint ineligible, never another account's", async () => {
  const failing = {
    get: (): string | null => {
      throw new Error("session store broke");
    },
    subscribe: () => () => {},
  };

  const probe = createMockEndpoint({ staleAfter: 1_000, scope: failing });

  const reach = new Reach({
    adapter: createMockNetwork().adapter,
    clock: createTestClock(),
    endpoints: { api: probe.definition },
  });

  reach.start();

  await expect(reach.endpoint("api").check()).rejects.toMatchObject({
    code: "SCOPE_UNAVAILABLE",
  });
  expect(reach.endpoint("api").state.get()).toMatchObject({
    scope: "unavailable",
    error: { code: "SCOPE_UNAVAILABLE" },
  });
  expect(probe.calls).toHaveLength(0);
});

test("T134 diagnostic events never carry a scope key", async () => {
  const { reach, probe, scope, api } = createScopedReach("secret-account");
  const events: ReachDiagnosticEvent[] = [];
  const listener = vi.fn((event: ReachDiagnosticEvent) => events.push(event));

  reach.diagnostics.events.subscribe(listener);
  reach.start();

  const checking = api.check();

  probe.fail("unauthorized");
  await checking;
  scope.update("another-secret");

  expect(events.length).toBeGreaterThan(0);
  expect(JSON.stringify(events)).not.toContain("secret");
  expect(JSON.stringify(reach.diagnostics.get())).not.toContain("secret");
});

test("a scope change never runs two checks at once for one endpoint", async () => {
  const scope = new ValueStore<string | null>("account-a");

  const probe = createMockEndpoint({
    staleAfter: 30_000,
    scope: scope.observable,
  });

  const clock = createTestClock();

  const reach = new Reach({
    adapter: createMockNetwork({ initial: CONNECTED_WIFI }).adapter,
    clock,
    endpoints: { api: probe.definition },
  });

  const api = reach.endpoint("api");

  // Subscribed before the Reach, so it hears the new key first and starts monitoring.
  scope.observable.subscribe(() => {
    if (scope.get() === "account-b") {
      api.monitor();
    }
  });

  let asked = false;

  // Asks once when the endpoint has nothing for the new key.
  api.state.subscribe(() => {
    const state = api.state.get();

    if (asked || state.freshness !== "never" || state.checking) {
      return;
    }

    if (scope.get() !== "account-b") {
      return;
    }

    asked = true;
    api.check().catch(() => {});
  });

  reach.start();

  const first = api.check();

  probe.pass();
  await first;
  clock.advance(5_000);

  scope.update("account-b");

  expect(reach.diagnostics.get().checks.outstanding).toBe(1);
  expect(probe.calls).toHaveLength(2);
});
