import type React from "react";

import type { Photo } from "example-shared/darkroom/photos/types/Photo";
import { PhotoTile } from "src/components/Darkroom/PhotoTile";

type PhotoGridProps = { photos: Photo[] };

export const PhotoGrid: React.FunctionComponent<PhotoGridProps> = ({
  photos,
}) => (
  <ul
    aria-label="Photos"
    className="grid max-h-[26rem] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3"
  >
    {photos.map((photo) => (
      <PhotoTile key={photo.id} photo={photo} />
    ))}
  </ul>
);
