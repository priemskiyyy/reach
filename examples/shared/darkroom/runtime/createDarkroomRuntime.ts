import type { ConditionState } from "@priemskiyyy/reach";

import {
  AUTOMATIC_DECISIONS,
  MANUAL_DECISIONS,
} from "example-shared/darkroom/backup/constants/decisions";
import type { BackupResult } from "example-shared/darkroom/backup/types/BackupResult";
import type { BackupRun } from "example-shared/darkroom/backup/types/BackupRun";
import { createDarkroomConditions } from "example-shared/darkroom/network/createDarkroomConditions";
import { createDarkroomReach } from "example-shared/darkroom/network/createDarkroomReach";
import { readRoute } from "example-shared/darkroom/network/readRoute";
import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { Photo } from "example-shared/darkroom/photos/types/Photo";
import type { DarkroomServices } from "example-shared/darkroom/runtime/types/DarkroomServices";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import { createValueStore } from "example-shared/utils/createValueStore";

/**
 * One Reach over one network source, and what Darkroom does with it: the
 * camera roll backs up on its own when the conditions allow, or when asked.
 * A disposed Reach cannot start again, so a switch of source replaces the
 * runtime; everything in `DarkroomServices` outlives it.
 */
export const createDarkroomRuntime = ({
  source,
  phone,
  backend,
  account,
  roll,
  automatic,
  timeline,
  activity,
}: DarkroomServices & { source: NetworkSource }) => {
  const reach = createDarkroomReach({
    source,
    phone,
    backend,
    account,
    activity,
  });

  const api = reach.endpoint("api");
  const conditions = createDarkroomConditions(reach);
  const lastRun = createValueStore<BackupRun | null>(null);
  const controller = new AbortController();

  let nextRunId = 1;
  let draining = false;
  let releaseMonitor: (() => void) | null = null;

  const stopTimeline = reach.diagnostics.events.subscribe((event) => {
    timeline.record(event, source);
  });

  const lease = reach.start();

  // A failed opening shows in the runtime's status, which the page reads instead.
  lease.ready.catch(() => {});

  const begin = (
    trigger: BackupRun["trigger"],
    owner: AccountId | null,
    condition: ConditionState,
  ) => {
    const id = nextRunId;

    nextRunId += 1;

    return (result: BackupResult) => {
      lastRun.set({ id, trigger, account: owner, condition, result });
    };
  };

  const upload = async (photo: Photo, owner: AccountId) => {
    roll.update(photo.id, { state: "uploading" });

    try {
      await backend.upload({
        signal: controller.signal,
        account: owner,
        photo: photo.id,
        route: readRoute(source, phone.state.get()),
      });
    } catch (error) {
      roll.update(photo.id, { state: "waiting" });

      throw error;
    }

    roll.update(photo.id, { state: "backed-up", account: owner });
  };

  // A failed upload is evidence too: the API's last answer no longer holds,
  // so it is dropped at once and checked again, instead of retried blindly.
  const recheck = () => {
    if (controller.signal.aborted) {
      return;
    }

    api.invalidate();

    // Its answer lands in the endpoint's state; a check that could not run has nothing to add.
    api.check().catch(() => {});
  };

  // Sends the waiting photos oldest first while `proceed` holds, and stops at the first failure.
  const drain = async (
    owner: AccountId,
    proceed: () => boolean,
  ): Promise<BackupResult> => {
    const next = () => (proceed() ? roll.nextWaiting() : undefined);
    let uploaded = 0;

    draining = true;

    try {
      for (let photo = next(); photo !== undefined; photo = next()) {
        await upload(photo, owner);
        uploaded += 1;
      }
    } catch (error) {
      recheck();

      return { state: "failed", uploaded, error };
    } finally {
      draining = false;
    }

    return { state: "backed-up", uploaded };
  };

  const canBackUpAutomatically = () =>
    automatic.get() &&
    AUTOMATIC_DECISIONS[conditions.automatic.get().status] === "back-up";

  const runAutomatic = () => {
    const owner = account.get();

    if (draining || owner === null) {
      return;
    }

    if (!canBackUpAutomatically() || roll.nextWaiting() === undefined) {
      return;
    }

    const publish = begin("automatic", owner, conditions.automatic.get());

    publish({ state: "running" });
    drain(
      owner,
      () => canBackUpAutomatically() && account.get() === owner,
    ).then(publish);
  };

  // Automatic backup is the API's one standing demand: while it is on, the API is monitored.
  const followAutomatic = () => {
    if (!automatic.get()) {
      releaseMonitor?.();
      releaseMonitor = null;

      return;
    }

    if (releaseMonitor === null) {
      releaseMonitor = api.monitor();
    }

    runAutomatic();
  };

  const stops = [
    automatic.subscribe(followAutomatic),
    conditions.automatic.subscribe(runAutomatic),
    roll.photos.subscribe(runAutomatic),
  ];

  followAutomatic();

  return {
    source,
    reach,
    api,
    conditions,
    lastRun: { get: lastRun.get, subscribe: lastRun.subscribe },
    /** Backs up every waiting photo now, unless the API is known to be unavailable. */
    backUpNow: async () => {
      if (draining) {
        return;
      }

      const owner = account.get();
      const condition = conditions.api.get();
      const publish = begin("manual", owner, condition);

      if (owner === null) {
        publish({ state: "signed-out" });

        return;
      }

      if (roll.nextWaiting() === undefined) {
        publish({ state: "nothing-waiting" });

        return;
      }

      if (MANUAL_DECISIONS[condition.status] === "refuse") {
        publish({ state: "refused" });

        return;
      }

      publish({ state: "running" });
      publish(await drain(owner, () => account.get() === owner));
    },
    dispose: () => {
      for (const stop of stops) {
        stop();
      }

      controller.abort(new Error("Darkroom switched its network source."));
      reach.dispose();
      stopTimeline();
    },
  };
};
