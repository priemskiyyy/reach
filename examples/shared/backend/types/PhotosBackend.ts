import type { createPhotosBackend } from "example-shared/backend/createPhotosBackend";

export type PhotosBackend = ReturnType<typeof createPhotosBackend>;
