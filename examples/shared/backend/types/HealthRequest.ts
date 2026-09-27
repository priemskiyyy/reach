import type { RequestRoute } from "example-shared/backend/types/RequestRoute";

export type HealthRequest = {
  signal: AbortSignal;
  account: string | null;
  route: RequestRoute;
};
