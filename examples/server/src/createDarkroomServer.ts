import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

import { ACCOUNT_HEADER } from "example-shared/backend/constants/headers";
import { createPhotosBackend } from "example-shared/backend/createPhotosBackend";
import { applyBackendChange } from "src/applyBackendChange";
import {
  accountHeader,
  backendChange,
  photoPath,
  readRequestBody,
} from "src/requests";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, PUT, POST, OPTIONS",
  "access-control-allow-headers": `content-type, ${ACCOUNT_HEADER}`,
};

const PHOTO_PATH = /^\/api\/photos\/(?<id>[^/]+)$/;

const send = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    ...CORS_HEADERS,
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
};

const readAccount = ({ headers }: IncomingMessage) =>
  accountHeader.parse(headers[ACCOUNT_HEADER] ?? null);

/**
 * Darkroom's API over real HTTP, answering from the same backend the web
 * example runs in the page: `GET /api/health`, `PUT /api/photos/:id`, and
 * `POST /api/control` for the lab.
 */
export const createDarkroomServer = () => {
  const backend = createPhotosBackend({ latency: 0 });

  // A client that hangs up, as Reach does at a check's deadline, aborts the work.
  const answer = async (
    response: ServerResponse,
    status: number,
    work: (signal: AbortSignal) => Promise<unknown>,
  ) => {
    const controller = new AbortController();

    response.once("close", () => {
      if (response.writableEnded) {
        return;
      }

      controller.abort(new Error("The client hung up."));
    });

    try {
      send(response, status, await work(controller.signal));
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      send(response, 503, null);
    }
  };

  const server = createServer(async (request, response) => {
    try {
      const { pathname } = new URL(request.url ?? "/", "http://localhost");
      const photo = PHOTO_PATH.exec(pathname)?.groups;

      if (request.method === "OPTIONS") {
        response.writeHead(204, CORS_HEADERS);
        response.end();

        return;
      }

      if (request.method === "GET" && pathname === "/api/health") {
        const account = readAccount(request);

        await answer(response, 200, (signal) =>
          backend.health({ signal, account, route: "direct" }),
        );

        return;
      }

      if (request.method === "PUT" && photo !== undefined) {
        const account = readAccount(request);
        const { id } = photoPath.parse(photo);

        if (account === null) {
          send(response, 401, null);

          return;
        }

        await answer(response, 201, (signal) =>
          backend.upload({ signal, account, photo: id, route: "direct" }),
        );

        return;
      }

      if (request.method === "POST" && pathname === "/api/control") {
        applyBackendChange(
          backend,
          backendChange.parse(await readRequestBody(request)),
        );
        send(response, 200, backend.state.get());

        return;
      }

      send(response, 404, null);
    } catch {
      send(response, 400, null);
    }
  });

  const dispose = () =>
    new Promise<void>((resolve, reject) => {
      if (!server.listening) {
        resolve();

        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);

          return;
        }

        resolve();
      });
      server.closeAllConnections();
    });

  return { server, backend, dispose };
};
