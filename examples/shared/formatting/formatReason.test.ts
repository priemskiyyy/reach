import type { ConditionReason } from "@priemskiyyy/reach";
import { expect, test } from "vitest";

import { formatReason } from "example-shared/formatting/formatReason";
import { formatReasons } from "example-shared/formatting/formatReasons";

const onApi = (code: string): ConditionReason => ({
  code,
  field: null,
  endpoint: "api",
});

test("the API's reasons say what is known about its last check", () => {
  expect(
    [
      "endpoint-unavailable",
      "scope-unavailable",
      "unobserved",
      "stale",
      "timeout",
    ].map((code) => formatReason(onApi(code))),
  ).toEqual([
    "the API's last check failed",
    "nobody is signed in, so the API is not checked",
    "the API has not been checked yet",
    "the API's last answer no longer holds",
    "the API's last check was inconclusive (timeout)",
  ]);
});

test("a mismatch reads against Darkroom's own requirement for that fact", () => {
  const reasons: ConditionReason[] = [
    { code: "mismatch", field: "internet.status", endpoint: null },
    { code: "mismatch", field: "cost.metered", endpoint: null },
    { code: "mismatch", field: "preferences.constrained", endpoint: null },
    { code: "mismatch", field: "connection.type", endpoint: null },
  ];

  expect(reasons.map(formatReason)).toEqual([
    "the internet is offline",
    "the connection is metered",
    "Low Data Mode is on",
    "Type is not what this needs",
  ]);
});

test("an unknown fact says why nothing can tell it, and never that it is false", () => {
  const reasons: ConditionReason[] = [
    { code: "unobserved", field: "cost.metered", endpoint: null },
    { code: "unsupported", field: "cost.metered", endpoint: null },
    { code: "source-unavailable", field: "internet.status", endpoint: null },
    { code: "source-ambiguous", field: "internet.status", endpoint: null },
    { code: "disconnected", field: "cost.metered", endpoint: null },
    { code: "observation-gap", field: "connection.type", endpoint: null },
    { code: "source-error", field: "connection.status", endpoint: null },
    { code: "runtime-idle", field: "connection.status", endpoint: null },
    { code: "evaluation-error", field: null, endpoint: null },
    { code: "carrier-said-so", field: "cost.expensive", endpoint: null },
  ];

  expect(reasons.map(formatReason)).toEqual([
    "nothing has told whether the connection is metered yet",
    "this source cannot tell whether the connection is metered",
    "this host has no network source to tell whether the internet is reachable",
    "the source could not tell whether the internet is reachable",
    "without a connection nothing tells whether the connection is metered",
    "the source may have missed a change",
    "the network source failed",
    "Reach is not running",
    "a condition failed while it was evaluated",
    "Expensive is unknown (carrier-said-so)",
  ]);
});

test("reasons that read the same are told once", () => {
  expect(
    formatReasons([
      { code: "source-error", field: "connection.status", endpoint: null },
      { code: "source-error", field: "cost.metered", endpoint: null },
      { code: "endpoint-unavailable", field: null, endpoint: "api" },
    ]),
  ).toBe("the network source failed; the API's last check failed");
});
