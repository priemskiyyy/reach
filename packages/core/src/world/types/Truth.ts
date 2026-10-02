/** What the fake operating system holds, whether or not it told anyone. */
export type Truth = {
  path: "wifi" | "cellular" | "none";
  reachable: boolean | null;
  metered: boolean;
};
