import type { ProbeContext } from "@priemskiyyy/reach";

import type { HttpEndpointOptions } from "src/types/HttpEndpointOptions";
import type { HttpAttempt } from "src/types/internal/HttpAttempt";

/** Sends one request, turning a throw or a rejection into a `rejected` attempt. */
export const sendRequest = async <TData>(
  request: HttpEndpointOptions<TData>["request"],
  context: ProbeContext,
): Promise<HttpAttempt<TData>> => {
  try {
    return { status: "resolved", data: await request(context) };
  } catch {
    return { status: "rejected" };
  }
};
