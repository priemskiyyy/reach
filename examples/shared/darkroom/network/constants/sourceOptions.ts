import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { Option } from "example-shared/types/Option";

export const SOURCE_OPTIONS: Option<NetworkSource>[] = [
  { value: "phone", label: "Simulated phone" },
  { value: "browser", label: "This browser" },
];
