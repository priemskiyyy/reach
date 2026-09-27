import { expect, test } from "vitest";

import type { EndpointRecordState } from "src/types/internal/EndpointRecordState";
import type { ProbeVerdict } from "src/types/ProbeVerdict";
import { EMPTY_RECORD_STATE, SCOPE_ERROR } from "src/utils/constants/endpoints";
import { evaluateAvailability } from "src/utils/internal/conditions/evaluateAvailability";
import { projectEndpointState } from "src/utils/internal/endpoints/projectEndpointState";
import type { ScopeReading } from "src/types/internal/ScopeReading";

const UNSCOPED: ScopeReading = { scope: "unscoped", key: null, error: null };

const recordWith = (
  verdict: ProbeVerdict,
  scopeKey: string | null = null,
): EndpointRecordState => ({
  ...EMPTY_RECORD_STATE,
  scopeKey,
  current: true,
  observation: {
    published: {
      check: 1,
      verdict,
      response: "received",
      reason: null,
      startedAt: 0,
      completedAt: 10,
      networkGeneration: 1,
    },
    completion: { monotonic: 10, wall: 10 },
  },
});

test("T067 T068 a fresh pass is available and a fresh fail unavailable", () => {
  expect(
    projectEndpointState(recordWith("pass"), UNSCOPED, false),
  ).toMatchObject({ status: "available", freshness: "fresh" });
  expect(
    projectEndpointState(recordWith("fail"), UNSCOPED, false),
  ).toMatchObject({ status: "unavailable", freshness: "fresh" });
});

test("T079 a fresh inconclusive check is unknown and keeps its explanation", () => {
  const state = projectEndpointState(
    recordWith("inconclusive"),
    UNSCOPED,
    false,
  );

  expect(state).toMatchObject({ status: "unknown", freshness: "fresh" });
  expect(evaluateAvailability("api", state).reasons).toEqual([
    { code: "inconclusive", field: null, endpoint: "api" },
  ]);
});

test("T081 T082 both a pass and a fail turn unknown once stale, keeping the history", () => {
  for (const verdict of ["pass", "fail"] satisfies ProbeVerdict[]) {
    const record = recordWith(verdict);
    const state = projectEndpointState(record, UNSCOPED, true);

    expect(state).toMatchObject({ status: "unknown", freshness: "stale" });
    expect(state.lastObservation).toBe(record.observation?.published);
  }
});

test("a revoked observation is stale whatever its age", () => {
  const record = { ...recordWith("pass"), current: false };

  expect(projectEndpointState(record, UNSCOPED, false).freshness).toBe("stale");
});

test("T127 T132 a record kept for another scope key shows nothing", () => {
  const state = projectEndpointState(
    recordWith("pass", "account-a"),
    { scope: "available", key: "account-b", error: null },
    false,
  );

  expect(state).toEqual({
    status: "unknown",
    freshness: "never",
    checking: false,
    scope: "available",
    lastObservation: null,
    lastAttempt: null,
    error: null,
  });
});

test("T126 a scope without a key is unavailable, and its condition says why", () => {
  const state = projectEndpointState(
    recordWith("pass", "account-a"),
    { scope: "unavailable", key: null, error: null },
    false,
  );

  expect(state.scope).toBe("unavailable");
  expect(evaluateAvailability("api", state)).toEqual({
    status: "unknown",
    reasons: [{ code: "scope-unavailable", field: null, endpoint: "api" }],
  });
});

test("a throwing scope shows its error and no history", () => {
  const state = projectEndpointState(
    recordWith("pass", "account-a"),
    { scope: "unavailable", key: null, error: SCOPE_ERROR },
    false,
  );

  expect(state.error).toBe(SCOPE_ERROR);
  expect(state.lastObservation).toBeNull();
});

test("an unavailable endpoint is unmet with a reason naming it", () => {
  const state = projectEndpointState(recordWith("fail"), UNSCOPED, false);

  expect(evaluateAvailability("api", state)).toEqual({
    status: "unmet",
    reasons: [{ code: "endpoint-unavailable", field: null, endpoint: "api" }],
  });
});
