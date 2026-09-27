import { API_TIMEOUT } from "example-shared/darkroom/network/constants/endpoint";
import { formatSeconds } from "example-shared/formatting/formatSeconds";

/** Why a check failed or was inconclusive, in Darkroom's words. */
export const formatCheckReason = (reason: string) => {
  if (reason === "request-failed") {
    return "the request failed before any answer arrived";
  }

  if (reason === "test-failed") {
    return "the API answered, but not ready";
  }

  if (reason === "timeout") {
    return `no answer within ${formatSeconds(API_TIMEOUT)}`;
  }

  return reason;
};
