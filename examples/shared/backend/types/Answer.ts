import type { RequestOutcome } from "example-shared/backend/types/RequestOutcome";

export type Answer<TData> =
  | { outcome: Exclude<RequestOutcome, "unavailable">; data: TData }
  | { outcome: "unavailable" };
