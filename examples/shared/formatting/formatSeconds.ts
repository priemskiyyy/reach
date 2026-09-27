/** Whole seconds, rounded up, so a countdown reaches 0 s only when it is over. */
export const formatSeconds = (milliseconds: number) =>
  `${Math.max(0, Math.ceil(milliseconds / 1_000))} s`;
