import type { ProbeResult } from "@priemskiyyy/reach";

/** The request answered, and the answer passed the test. */
export const PASSED: ProbeResult = Object.freeze<ProbeResult>({
  verdict: "pass",
  response: "received",
});

/** The request answered, and the answer failed the test. */
export const TEST_FAILED: ProbeResult = Object.freeze<ProbeResult>({
  verdict: "fail",
  response: "received",
  reason: "test-failed",
});

// A client rejects for a refused connection and for an error status alike, so whether a response arrived is unknown.
export const REQUEST_FAILED: ProbeResult = Object.freeze<ProbeResult>({
  verdict: "fail",
  response: "unknown",
  reason: "request-failed",
});
