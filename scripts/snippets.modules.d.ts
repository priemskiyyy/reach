// React Native is not installed here; snippets read its platform name and app state.
declare module "react-native" {
  export const Platform: { OS: string };

  export type AppStateStatus =
    "active" | "background" | "inactive" | "unknown" | "extension";

  export const AppState: {
    currentState: string | null | undefined;
    addEventListener: (
      type: "change",
      listener: (state: AppStateStatus) => void,
    ) => { remove: () => void };
  };
}

// Pulse is a sibling library, not installed here; snippets read its lifecycle phase.
declare module "@priemskiyyy/pulse" {
  type LifecycleState = {
    phase: "foreground" | "background" | "unknown";
    interaction: "available" | "unavailable" | "unknown";
  };

  export class Pulse {
    constructor(options: { adapter: object });
    state: {
      get: () => LifecycleState;
      subscribe: (listener: () => void) => () => void;
    };
    start: () => void;
    dispose: () => void;
  }
}

declare module "@priemskiyyy/pulse/browser" {
  export const browser: () => object;
}
