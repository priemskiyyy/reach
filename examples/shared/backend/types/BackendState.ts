export type BackendState = {
  latency: number;
  /** Every request answers 503. */
  offline: boolean;
  /** Health answers `degraded` and uploads are refused, while the API itself still answers. */
  degraded: boolean;
  /** The client keeps a request going after its caller aborts, as some native fetch clients do. */
  ignoreAbort: boolean;
};
