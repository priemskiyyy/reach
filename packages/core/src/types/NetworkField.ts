/**
 * The path of one normalized fact in `NetworkState`, which names its evidence
 * and its capability. There are eight, and a source reports all of them in
 * every observation.
 *
 * @example
 * ```ts
 * const field: NetworkField = "cost.metered";
 * const evidence = reach.state.get().evidence[field];
 * ```
 */
export type NetworkField =
  | "connection.status"
  | "connection.type"
  | "connection.transports"
  | "internet.status"
  | "cost.metered"
  | "cost.expensive"
  | "preferences.constrained"
  | "preferences.saveData";
