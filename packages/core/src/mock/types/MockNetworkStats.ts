/**
 * A frozen count of what a mock source did, for assertions: sessions opened
 * and cleaned up, sessions still open, and refreshes asked for.
 *
 * @example
 * ```ts
 * const { opens, activeSessions }: MockNetworkStats = mock.stats();
 * ```
 */
export type MockNetworkStats = {
  opens: number;
  cleanups: number;
  activeSessions: number;
  refreshes: number;
};
