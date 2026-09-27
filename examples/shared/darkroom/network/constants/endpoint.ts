/** A passed check stays fresh this long. */
export const API_STALE_AFTER = 20_000;

/** A check that takes longer is a timeout; the lab's 6 s latency outlasts it. */
export const API_TIMEOUT = 3_000;

/** While monitored in the foreground, the API is checked this often. */
export const API_INTERVAL = 15_000;
