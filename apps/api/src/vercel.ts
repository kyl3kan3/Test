/**
 * Vercel function entry — bundled into the Build Output API layout by
 * scripts/build-api.mjs. Node-style (req, res) handler via hono's node
 * adapter (streaming supported — same adapter the dev server uses).
 */
import { getRequestListener } from "@hono/node-server";
import { app } from "./app";

export default getRequestListener(app.fetch);
