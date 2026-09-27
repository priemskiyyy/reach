/** A clause as a sentence of its own. */
export const formatSentence = (clause: string) =>
  `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.`;
