import type { PhotoBackup } from "example-shared/darkroom/photos/types/PhotoBackup";
import { ACCOUNTS } from "example-shared/darkroom/users/constants/accounts";

export const formatPhotoBackup = (backup: PhotoBackup) => {
  if (backup.state === "backed-up") {
    return `In ${ACCOUNTS[backup.account].name}'s library`;
  }

  if (backup.state === "uploading") {
    return "Uploading to your API";
  }

  return "Only on this phone";
};
