import { match } from "ts-pattern";

import type { CheckRequest } from "example-shared/darkroom/network/types/CheckRequest";
import { formatError } from "example-shared/formatting/formatError";
import { formatObservation } from "example-shared/formatting/formatObservation";

/** What asking for a check answered; callers who asked at once say whether they shared it. */
export const formatCheckRequest = (request: CheckRequest) =>
  match(request)
    .with({ state: "running", callers: 1 }, () => "Checking the API.")
    .with(
      { state: "running" },
      ({ callers }) => `${callers} callers asked at once.`,
    )
    .with(
      { state: "settled", callers: 1 },
      ({ observation }) => `${formatObservation(observation)}.`,
    )
    .with(
      { state: "settled", checks: 1 },
      ({ callers, observation }) =>
        `${callers} callers, one request: ${formatObservation(observation)}.`,
    )
    .with(
      { state: "settled" },
      ({ callers, checks }) => `${callers} callers got ${checks} checks.`,
    )
    .with(
      { state: "failed" },
      ({ error }) => `The check did not finish: ${formatError(error)}`,
    )
    .exhaustive();
