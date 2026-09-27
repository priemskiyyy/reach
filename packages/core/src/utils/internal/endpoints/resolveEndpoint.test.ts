import { expect, test } from "vitest";

import type { EndpointDefinition } from "src/types/EndpointDefinition";
import { resolveEndpoint } from "src/utils/internal/endpoints/resolveEndpoint";

const check: EndpointDefinition["check"] = () => ({
  verdict: "pass",
  response: "received",
});

test("a definition gets the documented defaults", () => {
  expect(resolveEndpoint("api", { check, staleAfter: 30_000 }, false)).toEqual({
    name: "api",
    check,
    staleAfter: 30_000,
    timeout: 5_000,
    scope: null,
    monitoring: {
      on: ["start", "network-change"],
      interval: null,
      minInterval: 1_000,
      whenOffline: "skip",
      jitter: 0,
    },
  });
});

test("a given trigger list replaces the default instead of adding to it", () => {
  const { monitoring } = resolveEndpoint(
    "api",
    { check, staleAfter: 1, monitoring: { on: ["scope-change"] } },
    false,
  );

  expect(monitoring.on).toEqual(["scope-change"]);
});

test("T090 a freshness that is not a positive whole number is refused", () => {
  expect(() =>
    resolveEndpoint("api", { check, staleAfter: Number.NaN }, false),
  ).toThrow(expect.objectContaining({ code: "INVALID_CONFIGURATION" }));
  expect(() =>
    resolveEndpoint("api", { check, staleAfter: 1, timeout: -1 }, false),
  ).toThrow(expect.objectContaining({ code: "INVALID_CONFIGURATION" }));
});

test("a foreground trigger needs an activity source", () => {
  const definition: EndpointDefinition = {
    check,
    staleAfter: 1,
    monitoring: { on: ["foreground"] },
  };

  expect(() => resolveEndpoint("api", definition, false)).toThrow(
    expect.objectContaining({
      code: "INVALID_CONFIGURATION",
      message:
        'endpoints.api.monitoring.on has "foreground", which needs an activity source.',
    }),
  );
  expect(resolveEndpoint("api", definition, true).monitoring.on).toEqual([
    "foreground",
  ]);
});

test("T114 an interval needs an activity source or an explicit override", () => {
  const definition: EndpointDefinition = {
    check,
    staleAfter: 1,
    monitoring: { interval: 60_000 },
  };

  expect(() => resolveEndpoint("api", definition, false)).toThrow(
    expect.objectContaining({ code: "INVALID_CONFIGURATION" }),
  );
  expect(resolveEndpoint("api", definition, true).monitoring.interval).toBe(
    60_000,
  );
  expect(
    resolveEndpoint(
      "api",
      {
        ...definition,
        monitoring: { interval: 60_000, allowWithoutActivity: true },
      },
      false,
    ).monitoring.interval,
  ).toBe(60_000);
});

test("jitter is a share from 0 to 1", () => {
  for (const jitter of [-0.1, 1.5, Number.NaN]) {
    expect(() =>
      resolveEndpoint(
        "api",
        { check, staleAfter: 1, monitoring: { jitter } },
        false,
      ),
    ).toThrow(expect.objectContaining({ code: "INVALID_CONFIGURATION" }));
  }
});
