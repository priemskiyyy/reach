import type { z } from "zod";

import type { PhotosBackend } from "example-shared/backend/types/PhotosBackend";
import type { backendChange } from "src/requests";

export const applyBackendChange = (
  backend: PhotosBackend,
  change: z.infer<typeof backendChange>,
) => {
  if (change.latency !== undefined) {
    backend.setLatency(change.latency);
  }

  if (change.offline !== undefined) {
    backend.setOffline(change.offline);
  }

  if (change.degraded !== undefined) {
    backend.setDegraded(change.degraded);
  }
};
