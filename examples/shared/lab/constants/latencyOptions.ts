import type { Option } from "example-shared/types/Option";

/** 6 s outlasts the API check's 3 s timeout, so the check fails without an answer. */
export const LATENCY_OPTIONS: Option<number>[] = [
  { value: 0, label: "0 ms" },
  { value: 400, label: "400 ms" },
  { value: 6_000, label: "6 s" },
];
