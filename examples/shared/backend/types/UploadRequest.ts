import type { RequestRoute } from "example-shared/backend/types/RequestRoute";

export type UploadRequest = {
  signal: AbortSignal;
  account: string;
  photo: number;
  route: RequestRoute;
};
