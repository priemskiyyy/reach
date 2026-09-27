import { cva } from "class-variance-authority";

import type { PhotoHue } from "example-shared/darkroom/photos/types/PhotoHue";

export const thumbnailStyles = cva(
  "relative flex aspect-[4/3] w-full items-end overflow-hidden rounded-lg bg-linear-to-br p-2",
  {
    variants: {
      hue: {
        dawn: "from-amber-200 via-rose-200 to-rose-400",
        dusk: "from-orange-300 via-rose-400 to-fuchsia-600",
        sea: "from-sky-200 via-sky-400 to-teal-600",
        forest: "from-lime-200 via-emerald-400 to-emerald-700",
        night: "from-indigo-400 via-slate-700 to-slate-900",
      } satisfies Record<PhotoHue, string>,
    },
  },
);
