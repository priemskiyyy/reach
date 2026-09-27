export type NetInfoProfile = {
  /** Whether NetInfo's expense flag is the system's metering answer, as on Android. */
  metering: boolean;
  internet: "reported" | "ignore";
};
