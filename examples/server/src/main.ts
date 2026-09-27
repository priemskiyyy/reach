import { REQUEST_LABELS } from "example-shared/backend/constants/labels";
import { formatDuration } from "example-shared/formatting/formatDuration";
import { createDarkroomServer } from "src/createDarkroomServer";

const port = Number.parseInt(process.env.PORT ?? "4401", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const host = createDarkroomServer();

host.backend.requests.subscribe(() => {
  const [latest] = host.backend.requests.getSnapshot();

  if (latest === undefined) {
    return;
  }

  console.log(
    `${latest.method} ${latest.path} for ${latest.account ?? "nobody"}: ${REQUEST_LABELS[latest.outcome]} in ${formatDuration(latest.duration)}`,
  );
});

host.server.listen(port, "0.0.0.0", () => {
  console.log(`Darkroom's API: http://localhost:${port}/api/health`);
});

const shutdown = () => {
  host.dispose().catch(console.error);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
