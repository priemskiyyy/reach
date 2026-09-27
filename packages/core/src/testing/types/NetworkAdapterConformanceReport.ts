/**
 * The names of the checks an adapter passed, in the order they ran. A failed
 * check throws instead of appearing here.
 *
 * @example
 * ```ts
 * const { passed }: NetworkAdapterConformanceReport = await testNetworkAdapter(createHarness);
 * ```
 */
export type NetworkAdapterConformanceReport = {
  passed: string[];
};
