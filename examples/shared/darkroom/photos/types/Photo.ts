import type { PhotoBackup } from "example-shared/darkroom/photos/types/PhotoBackup";
import type { Shot } from "example-shared/darkroom/photos/types/Shot";

export type Photo = Shot & { id: number; backup: PhotoBackup };
