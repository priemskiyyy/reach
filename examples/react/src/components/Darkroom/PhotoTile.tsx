import type React from "react";

import { PHOTO_BACKUP_LABELS } from "example-shared/darkroom/backup/constants/labels";
import type { Photo } from "example-shared/darkroom/photos/types/Photo";
import { formatPhotoBackup } from "example-shared/formatting/formatPhotoBackup";
import { PHOTO_BACKUP_TONES } from "example-shared/ui/constants/tones";
import { thumbnailStyles } from "example-shared/ui/styles/thumbnailStyles";
import { Badge } from "src/components/Badge/Badge";

type PhotoTileProps = { photo: Photo };

export const PhotoTile: React.FunctionComponent<PhotoTileProps> = ({
  photo: { title, hue, backup },
}) => (
  <li aria-label={title} className="flex min-w-0 flex-col gap-1">
    <div className={thumbnailStyles({ hue })}>
      <Badge tone={PHOTO_BACKUP_TONES[backup.state]}>
        {PHOTO_BACKUP_LABELS[backup.state]}
      </Badge>
    </div>
    <span className="truncate text-sm font-medium">{title}</span>
    <span className="truncate text-xs text-slate-500 dark:text-slate-400">
      {formatPhotoBackup(backup)}
    </span>
  </li>
);
