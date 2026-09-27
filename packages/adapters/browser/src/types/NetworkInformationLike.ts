/**
 * The part of the browser's Network Information object the adapter reads:
 * the connection type and the data-saver preference where the browser has
 * them, and its change event. Browsers without it are still supported.
 *
 * @example
 * ```ts
 * const connection: NetworkInformationLike | undefined = target.navigator.connection;
 * ```
 */
export type NetworkInformationLike = {
  type?: string;
  saveData?: boolean;
  addEventListener: (type: "change", listener: () => void) => void;
  removeEventListener: (type: "change", listener: () => void) => void;
};
