/**
 * Bundles the Hono API into a single self-contained ESM file at api/index.mjs.
 * Vercel discovers it as the serverless function after the build step —
 * bundling sidesteps Node-ESM extensionless-import resolution entirely.
 */
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("api", { recursive: true });

await build({
  entryPoints: ["apps/api/src/vercel.ts"],
  outfile: "api/index.mjs",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: false,
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: "info",
});

console.log("API bundled to api/index.mjs");
