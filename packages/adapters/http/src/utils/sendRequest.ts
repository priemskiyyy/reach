import type { HttpEndpointOptions } from "src/types/HttpEndpointOptions";
import type { HttpRequest } from "src/types/HttpRequest";
import type { HttpAttempt } from "src/types/internal/HttpAttempt";

/** Sends one request, turning a throw or a rejection into a `rejected` attempt. */
export const sendRequest = async <TData>(
  request: HttpEndpointOptions<TData>["request"],
  httpRequest: HttpRequest,
): Promise<HttpAttempt<TData>> => {
  try {
    return { status: "resolved", data: await request(httpRequest) };
  } catch {
    return { status: "rejected" };
  }
};
