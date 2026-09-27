import type { EndpointObservation, EndpointState } from "@priemskiyyy/reach";
import { expect, test } from "vitest";

import { formatCheckRequest } from "example-shared/formatting/formatCheckRequest";
import { formatEndpointSummary } from "example-shared/formatting/formatEndpointSummary";

const PASSED: EndpointObservation = {
  check: 7,
  verdict: "pass",
  response: "received",
  reason: null,
  startedAt: 1_000,
  completedAt: 1_400,
  networkGeneration: 2,
};

const state = (patch: Partial<EndpointState>): EndpointState => ({
  status: "available",
  freshness: "fresh",
  checking: false,
  scope: "available",
  lastObservation: PASSED,
  lastAttempt: null,
  error: null,
  ...patch,
});

const at = (now: number) => ({ generation: 2, now });

test("a fresh answer says how long it still counts", () => {
  expect(formatEndpointSummary(state({}), at(6_400))).toBe(
    "Check #7 passed. It counts for 15 s more.",
  );
  expect(
    formatEndpointSummary(
      state({
        status: "unavailable",
        lastObservation: {
          ...PASSED,
          verdict: "fail",
          response: "received",
          reason: "test-failed",
        },
      }),
      at(1_400),
    ),
  ).toBe(
    "Check #7 failed: the API answered, but not ready. It counts for 20 s more.",
  );
});

test("a stale answer says why it no longer counts", () => {
  const stale = state({ status: "unknown", freshness: "stale" });

  expect(formatEndpointSummary(stale, { generation: 3, now: 2_000 })).toBe(
    "Check #7 passed, but it no longer counts: the network changed since.",
  );
  expect(formatEndpointSummary(stale, at(21_400))).toBe(
    "Check #7 passed, but it no longer counts: it is older than 20 s.",
  );
  expect(formatEndpointSummary(stale, at(2_000))).toBe(
    "Check #7 passed, but it no longer counts: it was dropped.",
  );
});

test("without an answer for this account it says so, and signed out borrows none", () => {
  const never = state({
    status: "unknown",
    freshness: "never",
    lastObservation: null,
  });

  expect(formatEndpointSummary(never, at(0))).toBe(
    "Not checked yet for this account.",
  );
  expect(formatEndpointSummary({ ...never, checking: true }, at(0))).toBe(
    "The first check for this account is on its way.",
  );
  expect(formatEndpointSummary({ ...never, scope: "unavailable" }, at(0))).toBe(
    "Nobody is signed in, so the API is not checked, and no other account's answer counts.",
  );
});

test("callers who asked at once say they shared one request", () => {
  expect(
    formatCheckRequest({
      state: "settled",
      callers: 2,
      checks: 1,
      observation: PASSED,
    }),
  ).toBe("2 callers, one request: Check #7 passed.");
  expect(
    formatCheckRequest({
      state: "settled",
      callers: 1,
      checks: 1,
      observation: { ...PASSED, verdict: "fail", reason: "timeout" },
    }),
  ).toBe("Check #7 failed: no answer within 3 s.");
  expect(formatCheckRequest({ state: "running", callers: 2 })).toBe(
    "2 callers asked at once.",
  );
});
