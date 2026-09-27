import type { EndpointDefinition } from "@priemskiyyy/reach";

import type { HttpEndpointOptions } from "src/types/HttpEndpointOptions";
import {
  PASSED,
  REQUEST_FAILED,
  TEST_FAILED,
} from "src/utils/constants/results";
import { sendRequest } from "src/utils/sendRequest";

/**
 * An endpoint checked through your own HTTP client. The request resolves
 * with parsed data and the test reads it with its type; an answer that fails
 * the test is unavailable with a received response, and a rejected request
 * is unavailable without knowing whether one arrived. Nothing is sent until
 * a check is demanded.
 *
 * @example
 * ```ts
 * const reach = new Reach({
 *   adapter,
 *   endpoints: {
 *     api: http({
 *       request: ({ signal }) => api.health.get({ signal }),
 *       test: ({ status }) => status === "ready",
 *       staleAfter: 30_000,
 *     }),
 *   },
 * });
 * ```
 */
export const http = <TData>({
  request,
  test,
  ...definition
}: HttpEndpointOptions<TData>): EndpointDefinition => ({
  ...definition,
  check: async (context) => {
    const attempt = await sendRequest(request, context);

    if (attempt.status === "rejected") {
      return REQUEST_FAILED;
    }

    // Reach no longer reads the answer of an aborted check, so it is never tested.
    if (context.signal.aborted) {
      return REQUEST_FAILED;
    }

    if (test === undefined) {
      return PASSED;
    }

    // Not caught: a throwing test is the check's own error.
    if (await test(attempt.data)) {
      return PASSED;
    }

    return TEST_FAILED;
  },
});
