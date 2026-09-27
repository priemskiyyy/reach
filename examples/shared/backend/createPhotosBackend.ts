import type { Answer } from "example-shared/backend/types/Answer";
import type { BackendState } from "example-shared/backend/types/BackendState";
import type { Health } from "example-shared/backend/types/Health";
import type { HealthRequest } from "example-shared/backend/types/HealthRequest";
import type { NetworkRequest } from "example-shared/backend/types/NetworkRequest";
import type { RequestRoute } from "example-shared/backend/types/RequestRoute";
import type { UploadRequest } from "example-shared/backend/types/UploadRequest";
import { createEventLog } from "example-shared/utils/createEventLog";
import { createValueStore } from "example-shared/utils/createValueStore";
import { wait } from "example-shared/utils/wait";

type Exchange = {
  method: NetworkRequest["method"];
  path: string;
  account: string | null;
  route: RequestRoute;
  signal: AbortSignal;
};

const answerHealth = ({ offline, degraded }: BackendState): Answer<Health> => {
  if (offline) {
    return { outcome: "unavailable" };
  }

  if (degraded) {
    return { outcome: "degraded", data: { status: "degraded" } };
  }

  return { outcome: "ready", data: { status: "ready" } };
};

const answerUpload =
  (photo: number) =>
  ({ offline, degraded }: BackendState): Answer<{ id: number }> => {
    if (offline || degraded) {
      return { outcome: "unavailable" };
    }

    return { outcome: "stored", data: { id: photo } };
  };

/**
 * Darkroom's own photos API and the client that calls it, inside the page.
 * The lab sets its latency, takes it offline or degrades it, the phone's link
 * decides how far a request gets, and every request lands in the network log.
 */
export const createPhotosBackend = ({ latency }: { latency: number }) => {
  const requests = createEventLog<NetworkRequest>(30);

  const state = createValueStore<BackendState>({
    latency,
    offline: false,
    degraded: false,
  });

  let nextId = 1;

  const exchange = async <TData>(
    { method, path, account, route, signal }: Exchange,
    answer: (current: BackendState) => Answer<TData>,
  ) => {
    const startedAt = Date.now();

    const record = (outcome: NetworkRequest["outcome"]) => {
      requests.add({
        id: nextId,
        method,
        path,
        account,
        outcome,
        duration: Date.now() - startedAt,
        at: startedAt,
      });
      nextId += 1;
    };

    if (route === "no-signal") {
      record("no-signal");

      throw new TypeError("Failed to fetch");
    }

    try {
      await wait(state.get().latency, signal);
    } catch (error) {
      record("aborted");

      throw error;
    }

    // The hotel's sign-in page answers instead, and the client cannot parse it.
    if (route === "portal") {
      record("portal");

      throw new SyntaxError(
        `Unexpected token '<', "<!doctype "... is not valid JSON`,
      );
    }

    const result = answer(state.get());

    record(result.outcome);

    if (result.outcome === "unavailable") {
      throw new Error("The photos API answered 503.");
    }

    return result.data;
  };

  return {
    health: ({ signal, account, route }: HealthRequest) =>
      exchange(
        { method: "GET", path: "/health", account, route, signal },
        answerHealth,
      ),
    upload: ({ signal, account, photo, route }: UploadRequest) =>
      exchange(
        { method: "PUT", path: `/photos/${photo}`, account, route, signal },
        answerUpload(photo),
      ),
    requests: requests.log,
    state: { get: state.get, subscribe: state.subscribe },
    setLatency: (next: number) => {
      state.set({ ...state.get(), latency: next });
    },
    setOffline: (offline: boolean) => {
      state.set({ ...state.get(), offline });
    },
    setDegraded: (degraded: boolean) => {
      state.set({ ...state.get(), degraded });
    },
  };
};
