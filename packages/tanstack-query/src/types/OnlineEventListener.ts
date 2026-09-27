/**
 * The setup function TanStack Query's online manager installs: it receives
 * `setOnline` and returns its own cleanup.
 *
 * @example
 * ```ts
 * onlineManager.setEventListener(listener satisfies OnlineEventListener);
 * ```
 */
export type OnlineEventListener = (
  setOnline: (online: boolean) => void,
) => () => void;
