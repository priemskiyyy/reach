import type { ObservableValue } from "@priemskiyyy/reach";

export type ValueStore<T> = ObservableValue<T> & { set: (next: T) => void };
