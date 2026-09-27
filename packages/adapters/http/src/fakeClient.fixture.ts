import type { ProbeContext } from "@priemskiyyy/reach";

export type Health = { status: "ready" | "degraded" };

/**
 * An application's own client for the tests: it records every request and
 * holds it until the test answers or fails it, oldest first.
 */
export const createFakeClient = () => {
  const requests: ProbeContext[] = [];

  const held: Array<{
    resolve: (health: Health) => void;
    reject: (error: Error) => void;
  }> = [];

  const take = () => {
    const request = held.shift();

    if (request === undefined) {
      throw new Error("No request is held.");
    }

    return request;
  };

  return {
    requests,
    request: (sent: ProbeContext) => {
      requests.push(sent);

      return new Promise<Health>((resolve, reject) => {
        held.push({ resolve, reject });
      });
    },
    /** The oldest request resolves with this parsed answer. */
    answer: (health: Health) => {
      take().resolve(health);
    },
    /** The oldest request rejects, as a refusal or an error status does. */
    fail: (error = new Error("The request was refused.")) => {
      take().reject(error);
    },
  };
};
