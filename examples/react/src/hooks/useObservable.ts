import type { ObservableValue } from "@priemskiyyy/reach";
import { useSyncExternalStore } from "react";

export const useObservable = <T>(observable: ObservableValue<T>) =>
  useSyncExternalStore(observable.subscribe, observable.get, observable.get);
