// Names that stand for the reader's application in documentation snippets.
import type { ObservableValue, Reach } from "@priemskiyyy/reach";

type SnippetHealth = { status: "ready" | "degraded" };

declare global {
  /** The application's own HTTP client. */
  const client: {
    health: {
      get: (options: { signal: AbortSignal }) => Promise<SnippetHealth>;
    };
    account: {
      health: (options: {
        account: string | null;
        signal: AbortSignal;
      }) => Promise<SnippetHealth>;
    };
  };

  /** The signed-in account, as the application tracks it. */
  const session: { account: ObservableValue<string | null> };

  /** A setting the user controls. */
  const settings: ObservableValue<{ allowAnyNetwork: boolean }>;

  /** Starts the application's uploads. */
  const startUploads: () => void;

  /** The application's Reach, created once at bootstrap. */
  const network: Reach<unknown, "api">;
}
