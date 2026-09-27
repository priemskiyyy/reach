import type { NetworkState } from "src/types/NetworkState";

export type NetworkFacts = Omit<NetworkState, "revision" | "generation">;
