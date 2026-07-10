/**
 * Emits the Vercel Build Output API (v3) layout:
 *   .vercel/output/config.json                      — routing
 *   .vercel/output/static/*                          — public/ pages
 *   .vercel/output/functions/api/index.func/…        — bundled Hono API
 *
 * The /api source-directory convention is scanned BEFORE buildCommand runs,
 * so build-generated functions must go through this explicit layout instead.
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = ".vercel/output";
const FUNC = `${OUT}/functions/api/index.func`;

mkdirSync(`${OUT}/static`, { recursive: true });
mkdirSync(FUNC, { recursive: true });

// Static pages (terms/privacy)
cpSync("public", `${OUT}/static`, { recursive: true });

// Routing: pretty legal-page URLs, static files, then everything /api/* to the function.
writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "/terms", dest: "/terms.html" },
        { src: "/privacy", dest: "/privacy.html" },
        { src: "/demo/?", dest: "/demo/index.html" },
        { handle: "filesystem" },
        { src: "/api/(.*)", dest: "/api/index" },
        // SPA fallback: client-side routes under /demo survive a refresh.
        { src: "/demo/(.*)", dest: "/demo/index.html" },
      ],
    },
    null,
    2,
  ),
);

writeFileSync(
  `${FUNC}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      maxDuration: 120,
    },
    null,
    2,
  ),
);

await build({
  entryPoints: ["apps/api/src/vercel.ts"],
  outfile: `${FUNC}/index.mjs`,
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: false,
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: "info",
});

console.log("Build Output API layout written to .vercel/output");
