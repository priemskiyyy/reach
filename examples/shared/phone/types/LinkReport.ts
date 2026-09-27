export type LinkReport = {
  type: "wifi" | "cellular";
  metered: boolean;
  expensive: boolean;
  /** Whether the phone validated a path to the internet over this link. */
  validated: boolean;
};
