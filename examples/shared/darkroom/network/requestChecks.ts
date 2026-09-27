import type { EndpointHandle } from "@priemskiyyy/reach";

import type { CheckRequest } from "example-shared/darkroom/network/types/CheckRequest";

/** Asks for a check from `callers` callers at once; while one runs, every caller joins it. */
export const requestChecks = async (
  api: EndpointHandle,
  callers: number,
): Promise<CheckRequest> => {
  try {
    const [first, ...rest] = await Promise.all([
      api.check(),
      ...Array.from({ length: callers - 1 }, () => api.check()),
    ]);

    const checks = new Set(
      [first, ...rest].map(({ observation }) => observation.check),
    );

    return {
      state: "settled",
      callers,
      checks: checks.size,
      observation: first.observation,
    };
  } catch (error) {
    return { state: "failed", callers, error };
  }
};
