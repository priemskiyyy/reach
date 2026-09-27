import { JSDOM } from "jsdom";

type ConnectionInput = { type?: string; saveData?: boolean };

// A real jsdom window, from another realm, whose connection a test controls
// and whose listeners it counts.
export const createFakeWindow = ({
  onLine = true,
  connection = null,
}: { onLine?: unknown; connection?: ConnectionInput | null } = {}) => {
  const { window } = new JSDOM("<!doctype html>");
  const page: { onLine: unknown } = { onLine };
  const listeners = { count: 0 };

  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => page.onLine,
  });

  const count = (target: EventTarget) => {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);

    Object.defineProperties(target, {
      addEventListener: {
        configurable: true,
        value: (...args: Parameters<EventTarget["addEventListener"]>) => {
          listeners.count += 1;
          add(...args);
        },
      },
      removeEventListener: {
        configurable: true,
        value: (...args: Parameters<EventTarget["removeEventListener"]>) => {
          listeners.count -= 1;
          remove(...args);
        },
      },
    });
  };

  const networkInformation =
    connection === null
      ? null
      : Object.assign(new window.EventTarget(), connection);

  if (networkInformation !== null) {
    count(networkInformation);
    Object.defineProperty(window.navigator, "connection", {
      configurable: true,
      value: networkInformation,
    });
  }

  count(window);
  count(window.document);

  const fire = (target: EventTarget, type: string) =>
    target.dispatchEvent(new window.Event(type));

  return {
    window,
    connection: networkInformation,
    listenerCount: () => listeners.count,
    goOffline: () => {
      page.onLine = false;
      fire(window, "offline");
    },
    goOnline: () => {
      page.onLine = true;
      fire(window, "online");
    },
    setOnLine: (value: unknown) => {
      page.onLine = value;
    },
    changeConnection: (next: ConnectionInput) => {
      if (networkInformation === null) {
        throw new Error("This window has no Network Information.");
      }

      Object.assign(networkInformation, next);
      fire(networkInformation, "change");
    },
    pageHide: () => fire(window, "pagehide"),
    pageShow: () => fire(window, "pageshow"),
    freeze: () => fire(window.document, "freeze"),
    resume: () => fire(window.document, "resume"),
  };
};
