import type { MockEndpoint } from "src/mock/types/MockEndpoint";
import type { MockProbeCall } from "src/mock/types/MockProbeCall";
import type { EndpointDefinition } from "src/types/EndpointDefinition";
import type { ProbeContext } from "src/types/ProbeContext";
import type { ProbeResult } from "src/types/ProbeResult";

/**
 * An endpoint whose calls a test settles one by one, for proving how Reach
 * shares, supersedes, times out and caps them.
 *
 * @example
 * ```ts
 * const probe = createMockEndpoint({ staleAfter: 30_000 });
 * const reach = new Reach({ adapter, endpoints: { api: probe.definition } });
 * const checking = reach.endpoint("api").check();
 *
 * probe.pass();
 * await checking;
 * ```
 */
export const createMockEndpoint = (
  options: Omit<EndpointDefinition, "check">,
): MockEndpoint => {
  const calls: MockProbeCall[] = [];

  let nextFailure: { error: unknown } | null = null;

  const getOldestPending = () => {
    const call = calls.find((candidate) => !candidate.settled());

    if (call === undefined) {
      throw new Error("No endpoint check is waiting.");
    }

    return call;
  };

  const check = (context: ProbeContext) => {
    const failure = nextFailure;

    nextFailure = null;

    if (failure !== null) {
      throw failure.error;
    }

    let settled = false;

    return new Promise<ProbeResult>((resolve, reject) => {
      calls.push({
        context,
        resolve: (result) => {
          settled = true;
          resolve(result);
        },
        reject: (error) => {
          settled = true;
          reject(error);
        },
        settled: () => settled,
      });
    });
  };

  return Object.freeze({
    definition: Object.freeze({ ...options, check }),
    calls,
    pass: () => {
      getOldestPending().resolve({ verdict: "pass", response: "received" });
    },
    fail: (reason?: string) => {
      getOldestPending().resolve({
        verdict: "fail",
        response: "received",
        ...(reason === undefined ? {} : { reason }),
      });
    },
    inconclusive: (reason?: string) => {
      getOldestPending().resolve({
        verdict: "inconclusive",
        response: "unknown",
        ...(reason === undefined ? {} : { reason }),
      });
    },
    throwNext: (error: unknown) => {
      nextFailure = { error };
    },
    pending: () => calls.filter((call) => !call.settled()).length,
  });
};
