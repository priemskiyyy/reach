import {
  FIRST_SHOTS,
  SHOTS,
} from "example-shared/darkroom/photos/constants/shots";
import type { Photo } from "example-shared/darkroom/photos/types/Photo";
import type { PhotoBackup } from "example-shared/darkroom/photos/types/PhotoBackup";
import { createValueStore } from "example-shared/utils/createValueStore";

const isWaiting = ({ backup }: Photo) => backup.state === "waiting";

/** The phone's photos, newest first, each with where its backup stands. */
export const createCameraRoll = () => {
  const photos = createValueStore<Photo[]>(
    FIRST_SHOTS.map((shot, index) => ({
      ...shot,
      id: FIRST_SHOTS.length - index,
      backup: { state: "backed-up", account: "ines" },
    })),
  );

  let taken = 0;

  const update = (id: number, backup: PhotoBackup) => {
    photos.set(
      photos
        .get()
        .map((photo) => (photo.id === id ? { ...photo, backup } : photo)),
    );
  };

  return {
    photos: { get: photos.get, subscribe: photos.subscribe },
    take: () => {
      const shot = SHOTS[taken % SHOTS.length] ?? SHOTS[0];

      const photo: Photo = {
        ...shot,
        id: FIRST_SHOTS.length + taken + 1,
        backup: { state: "waiting" },
      };

      taken += 1;
      photos.set([photo, ...photos.get()]);

      return photo;
    },
    /** The oldest photo still waiting, which a backup sends first. */
    nextWaiting: () => photos.get().filter(isWaiting).at(-1),
    countWaiting: () => photos.get().filter(isWaiting).length,
    update,
  };
};
