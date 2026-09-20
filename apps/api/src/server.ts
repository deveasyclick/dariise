import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { closeDatabase } from "./db/client.js";
import { env } from "./shared/config.js";

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.info(
    `[api] listening on http://localhost:${info.port} (${env.NODE_ENV})`,
  );
});

// Close the listener before draining the pool, so in-flight requests finish. A
// second signal exits immediately rather than hanging on a stuck connection.
let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    console.warn(`[api] ${signal} again — exiting immediately`);
    process.exit(1);
  }

  shuttingDown = true;
  console.info(`[api] ${signal} received, shutting down`);

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  await closeDatabase();
  process.exit(0);
}

process.on("SIGTERM", (signal) => void shutdown(signal));
process.on("SIGINT", (signal) => void shutdown(signal));
