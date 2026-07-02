/** Tiny SPA static server for the Expo web export (dist/). */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.argv[2] ?? "apps/mobile/dist";
const port = Number(process.env.PORT ?? 8788);

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let path = normalize(url.pathname).replace(/^\/+/, "");
  if (path === "") path = "index.html";
  try {
    const file = await readFile(join(root, path));
    res.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream" });
    res.end(file);
  } catch {
    // SPA fallback — expo-router handles the route client-side.
    const index = await readFile(join(root, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(index);
  }
}).listen(port, () => console.log(`web on http://localhost:${port}`));
