import type { Shot } from "example-shared/darkroom/photos/types/Shot";

/** What the camera takes next, in turn. */
export const SHOTS: [Shot, ...Shot[]] = [
  { title: "Tram in the rain", hue: "night" },
  { title: "Tide pools", hue: "sea" },
  { title: "Morning market", hue: "dawn" },
  { title: "Pine ridge", hue: "forest" },
  { title: "Harbour at dusk", hue: "dusk" },
  { title: "Night ferry", hue: "night" },
  { title: "Fig tree", hue: "forest" },
  { title: "Rooftops at dawn", hue: "dawn" },
];

/** The roll the phone starts with, newest first and already in Inês's library. */
export const FIRST_SHOTS: Shot[] = [
  { title: "Lighthouse", hue: "sea" },
  { title: "Orange grove", hue: "dusk" },
  { title: "Old town steps", hue: "dawn" },
];
