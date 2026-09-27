/**
 * One kind of link a source can report. A VPN is reported beside the link it
 * runs over, never instead of it, so its presence proves nothing about Wi-Fi.
 *
 * @example
 * ```ts
 * const transports: Transport[] | null = reach.state.get().connection.transports;
 * ```
 */
export type Transport =
  "wifi" | "cellular" | "ethernet" | "bluetooth" | "vpn" | "wimax" | "other";
