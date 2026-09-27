import type { ObservableValue } from "src/types/ObservableValue";
import { Listeners } from "src/utils/internal/observable/Listeners";
import { ReachError } from "src/utils/ReachError";

type DerivedValueOptions<TValue> = {
  sources: ObservableValue<unknown>[];
  /** Reads the sources itself; it runs again only when one of their values changed. */
  compute: () => TValue;
  /** Keeps the previous value's identity when the next one is equal to it. */
  isEqual?: (previous: TValue, next: TValue) => boolean;
};

type Cache<TValue> = { inputs: unknown[] | null; value: TValue };

const readInputs = (sources: ObservableValue<unknown>[]) => {
  try {
    return sources.map((source) => source.get());
  } catch {
    // A throwing source is never cached, so its next read is tried again.
    return null;
  }
};

const isSameInputs = (previous: unknown[] | null, next: unknown[] | null) => {
  if (previous === null) {
    return false;
  }

  if (next === null) {
    return false;
  }

  return previous.every((input, index) => Object.is(input, next[index]));
};

// Reads pull from the sources, so a listener of any source already reads the
// value of the transaction it is notified about, whatever the listener order.
export class DerivedValue<TValue> {
  #sources: ObservableValue<unknown>[];
  #compute: () => TValue;
  #isEqual: (previous: TValue, next: TValue) => boolean;
  #cache: Cache<TValue> | null = null;
  #reading = false;
  #listeners = new Listeners();
  #announced: { value: TValue } | null = null;
  #unsubscribes: Array<() => void> = [];

  constructor({
    sources,
    compute,
    isEqual = Object.is,
  }: DerivedValueOptions<TValue>) {
    this.#sources = [...new Set(sources)];
    this.#compute = compute;
    this.#isEqual = isEqual;
  }

  get = (): TValue => {
    if (this.#reading) {
      throw new ReachError({
        code: "EVALUATION_ERROR",
        message: "A derived value depends on itself.",
      });
    }

    this.#reading = true;

    try {
      return this.#read();
    } finally {
      this.#reading = false;
    }
  };

  subscribe = (listener: () => void) => {
    const remove = this.#listeners.add(listener);

    if (this.#listeners.size() === 1) {
      this.#attach();
    }

    return () => {
      remove();

      if (this.#listeners.size() > 0) {
        return;
      }

      this.#detach();
    };
  };

  observable: ObservableValue<TValue> = Object.freeze({
    get: this.get,
    subscribe: this.subscribe,
  });

  #read() {
    const inputs = readInputs(this.#sources);
    const cache = this.#cache;

    if (cache !== null && isSameInputs(cache.inputs, inputs)) {
      return cache.value;
    }

    const next = this.#compute();

    const value =
      cache !== null && this.#isEqual(cache.value, next) ? cache.value : next;

    this.#cache = { inputs, value };

    return value;
  }

  #attach() {
    this.#unsubscribes = this.#sources.map((source) =>
      source.subscribe(this.#handleSourceChange),
    );
    this.#announced = { value: this.get() };
  }

  #detach() {
    const unsubscribes = this.#unsubscribes;

    this.#unsubscribes = [];
    this.#announced = null;

    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  }

  #handleSourceChange = () => {
    const value = this.get();
    const announced = this.#announced;

    if (announced !== null && Object.is(announced.value, value)) {
      return;
    }

    this.#announced = { value };
    this.#listeners.notify();
  };
}
