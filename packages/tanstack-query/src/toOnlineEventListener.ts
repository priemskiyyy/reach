import type { Condition } from "@priemskiyyy/reach";

import type { OnlineEventListener } from "src/types/OnlineEventListener";
import type { OnlineEventListenerOptions } from "src/types/OnlineEventListenerOptions";
import { readOnline } from "src/utils/readOnline";

/**
 * Turns a condition into the setup function Query's online manager
 * installs. Online means Query may treat networking as available, not that
 * Reach verified the internet. It publishes the current answer on setup and
 * each change after, never the same Boolean twice, and nothing once its
 * cleanup ran. Install it once, at bootstrap; creating it changes nothing.
 *
 * @example
 * ```ts
 * import { onlineManager } from "@tanstack/query-core";
 *
 * onlineManager.setEventListener(
 *   toOnlineEventListener(network.condition({ internet: "online" })),
 * );
 * ```
 */
export const toOnlineEventListener =
  (
    condition: Condition,
    { unknown = "online" }: OnlineEventListenerOptions = {},
  ): OnlineEventListener =>
  (setOnline) => {
    let published: boolean | null = null;
    let installed = true;

    const publish = () => {
      if (!installed) {
        return;
      }

      const online = readOnline(condition.get().status, unknown);

      if (online === null) {
        return;
      }

      if (online === published) {
        return;
      }

      published = online;
      setOnline(online);
    };

    // Subscribed before the first read, so a change between the two is never missed.
    const unsubscribe = condition.subscribe(publish);

    publish();

    return () => {
      installed = false;
      unsubscribe();
    };
  };
