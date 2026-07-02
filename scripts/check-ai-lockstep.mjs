#!/usr/bin/env node
/**
 * AI SDK packages must move in major-version lockstep:
 *   ai@7.x  <->  @ai-sdk/anthropic@4.x, @ai-sdk/openai@4.x, @ai-sdk/react@4.x
 * A major mismatch fails silently at the stream-parsing layer, so CI fails hard here instead.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED = {
  ai: 7,
  "@ai-sdk/anthropic": 4,
  "@ai-sdk/openai": 4,
  "@ai-sdk/react": 4,
};

const manifests = ["apps/api/package.json", "apps/mobile/package.json"];

let failed = false;
for (const rel of manifests) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(resolve(root, rel), "utf8"));
  } catch {
    continue;
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [name, expectedMajor] of Object.entries(EXPECTED)) {
    const spec = deps[name];
    if (!spec) continue;
    const major = Number.parseInt(spec.replace(/^[~^]/, ""), 10);
    if (major !== expectedMajor) {
      console.error(
        `${rel}: ${name}@${spec} — expected major ${expectedMajor} (AI SDK lockstep)`,
      );
      failed = true;
    }
    if (/^[~^]/.test(spec)) {
      console.error(`${rel}: ${name}@${spec} — AI SDK packages must be exact-pinned`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("AI SDK lockstep OK");
