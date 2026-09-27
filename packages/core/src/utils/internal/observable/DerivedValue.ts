import type { ObservableValue } from "src/types/ObservableValue";
import { Listeners } from "src/utils/internal/observable/Listeners";
import { isolate } from "src/utils/internal/reporting/isolate";
import { reportUnhandledError } from "src/utils/internal/reporting/reportUnhandledError";
import { ReachError } from "src/utils/ReachError";

type DerivedValueOptions<TValue> = {
  sources: ObservableValue<unknown>[];
  /** Reads the sources itself; it runs again only when one of their values changed. */
  compute: () => TValue;
  /** Keeps the previous value's identity when the next one is equal to it. */
  isEqual?: (previous: TValue, next: TValue) => boolean;
  /** Where the derived value's own listeners are registered, and their errors reported. */
  listeners?: Listeners;
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
  #listeners: Listeners;
  #announced: { value: TValue } | null = null;
  #unsubscribes: Array<() => void> = [];

  constructor({
    sources,
    compute,
    isEqual = Object.is,
    listeners = new Listeners(),
  }: DerivedValueOptions<TValue>) {
    this.#sources = [...new Set(sources)];
    this.#compute = compute;
    this.#isEqual = isEqual;
    this.#listeners = listeners;
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
    // Attached before the listener is registered, so a source that refuses leaves nothing behind.
    if (this.#listeners.size() === 0) {
      this.#attach();
    }

    const remove = this.#listeners.add(listener);

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
    const unsubscribes: Array<() => void> = [];

    try {
      for (const source of this.#sources) {
        unsubscribes.push(source.subscribe(this.#handleSourceChange));
      }

      this.#announced = { value: this.get() };
    } catch (error) {
      for (const unsubscribe of unsubscribes) {
        isolate(unsubscribe, reportUnhandledError);
      }

      throw error;
    }

    this.#unsubscribes = unsubscribes;
  }

  #detach() {
    const unsubscribes = this.#unsubscribes;

    this.#unsubscribes = [];
    this.#announced = null;

    // A source whose unsubscribe throws never keeps the others subscribed.
    for (const unsubscribe of unsubscribes) {
      isolate(unsubscribe, reportUnhandledError);
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
