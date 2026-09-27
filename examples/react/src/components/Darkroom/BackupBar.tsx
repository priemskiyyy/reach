import { Camera, CloudArrowUp } from "@phosphor-icons/react";
import type React from "react";

import type { Photo } from "example-shared/darkroom/photos/types/Photo";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { formatPhotoCount } from "example-shared/formatting/formatPhotoCount";
import { buttonStyles } from "example-shared/ui/styles/buttonStyles";
import { RunNotice } from "src/components/Darkroom/RunNotice";

type BackupBarProps = {
  runtime: DarkroomRuntime;
  photos: Photo[];
  onTakePress: () => void;
  onBackUpPress: () => void;
};

export const BackupBar: React.FunctionComponent<BackupBarProps> = ({
  runtime,
  photos,
  onTakePress,
  onBackUpPress,
}) => {
  const waiting = photos.filter(({ backup }) => backup.state === "waiting");
  const uploading = photos.some(({ backup }) => backup.state === "uploading");

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTakePress}
          className={buttonStyles({ variant: "primary" })}
        >
          <Camera aria-hidden="true" size={16} weight="bold" />
          Take photo
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={onBackUpPress}
          className={buttonStyles()}
        >
          <CloudArrowUp aria-hidden="true" size={16} weight="bold" />
          Back up now
        </button>
        <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          {formatPhotoCount(waiting.length)} waiting
        </span>
      </div>
      <RunNotice runtime={runtime} />
    </div>
  );
};
