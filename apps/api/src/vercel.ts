/** Vercel function entry — bundled to /api/index.mjs by scripts/build-api.mjs. */
import { handle } from "hono/vercel";
import { app } from "./app";

export default handle(app);
