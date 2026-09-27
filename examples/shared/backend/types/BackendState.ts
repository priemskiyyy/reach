export type BackendState = {
  latency: number;
  /** Every request answers 503. */
  offline: boolean;
  /** Health answers `degraded` and uploads are refused, while the API itself still answers. */
  degraded: boolean;
};
