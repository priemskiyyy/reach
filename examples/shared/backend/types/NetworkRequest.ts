import type { RequestOutcome } from "example-shared/backend/types/RequestOutcome";

export type NetworkRequest = {
  id: number;
  method: "GET" | "PUT";
  path: string;
  /** The account the request was sent for, as its header carries it. */
  account: string | null;
  outcome: RequestOutcome;
  duration: number;
  at: number;
};
