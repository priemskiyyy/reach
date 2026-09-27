/** What one request came to: parsed data, or a rejection nobody can classify further. */
export type HttpAttempt<TData> =
  { status: "resolved"; data: TData } | { status: "rejected" };
