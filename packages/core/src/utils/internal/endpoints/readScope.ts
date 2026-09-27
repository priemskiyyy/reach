import type { ObservableValue } from "src/types/ObservableValue";
import type { ScopeReading } from "src/types/internal/ScopeReading";
import { SCOPE_ERROR } from "src/utils/constants/endpoints";

/** The current scope key; a throwing scope makes the endpoint ineligible, never another account's. */
export const readScope = (
  scope: ObservableValue<string | null> | null,
): ScopeReading => {
  if (scope === null) {
    return { scope: "unscoped", key: null, error: null };
  }

  let key: string | null;

  try {
    key = scope.get();
  } catch {
    return { scope: "unavailable", key: null, error: SCOPE_ERROR };
  }

  if (key === null) {
    return { scope: "unavailable", key: null, error: null };
  }

  return { scope: "available", key, error: null };
};
