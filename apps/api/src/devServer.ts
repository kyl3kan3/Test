/**
 * Local/e2e server — runs the same Hono app the Vercel function exports.
 * Env is provided by the caller (see e2e/playwright.config.ts).
 */
import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`dothething-api listening on http://localhost:${info.port}`);
});
