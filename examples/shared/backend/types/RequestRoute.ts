/** How far a request gets: to your API, nowhere without a signal, or to a hotel's sign-in page. */
export type RequestRoute = "direct" | "no-signal" | "portal";
