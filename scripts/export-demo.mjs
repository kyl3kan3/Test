/**
 * Builds the public interactive demo into public/demo/.
 *
 * The demo is the real mobile app exported for web with EXPO_PUBLIC_DEMO=1:
 * the entire backend (auth, breakdowns, streaks, coach) runs in-memory in the
 * browser — no accounts, no API keys, no server. Vercel serves the result
 * statically at /demo on the API deployment.
 *
 * Run from the repo root: node scripts/export-demo.mjs
 */
import { execSync } from "node:child_process";
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const APP_JSON = "apps/mobile/app.json";
const original = readFileSync(APP_JSON, "utf8");
const config = JSON.parse(original);

// Asset URLs must resolve under /demo/, not the domain root.
config.expo.experiments = { ...config.expo.experiments, baseUrl: "/demo" };
writeFileSync(APP_JSON, JSON.stringify(config, null, 2) + "\n");

try {
  // -c clears Metro's cache: EXPO_PUBLIC_* values are inlined at transform
  // time and the cache does not key on them, so stale flags leak otherwise.
  execSync("npx expo export -p web --output-dir dist-demo -c", {
    cwd: "apps/mobile",
    stdio: "inherit",
    env: {
      ...process.env,
      EXPO_PUBLIC_DEMO: "1",
      EXPO_PUBLIC_E2E: "1", // stubbed purchases (RevenueCat has no web SDK)
      EXPO_PUBLIC_API_URL: "https://demo.invalid", // never contacted in demo mode
    },
  });
} finally {
  writeFileSync(APP_JSON, original);
}

rmSync("public/demo", { recursive: true, force: true });
cpSync("apps/mobile/dist-demo", "public/demo", { recursive: true });

// The exported font catalog ships every weight; the app loads six. Trim the rest.
const KEEP =
  /nunito\/(400Regular|600SemiBold|700Bold)\/|fraunces\/(500Medium|600SemiBold|600SemiBold_Italic)\//;
for (const family of ["nunito", "fraunces"]) {
  const dir = `public/demo/assets/__node_modules/@expo-google-fonts/${family}`;
  for (const entry of execSync(`ls ${dir}`).toString().trim().split("\n")) {
    if (!KEEP.test(`${family}/${entry}/`)) rmSync(`${dir}/${entry}`, { recursive: true });
  }
}

console.log("Demo exported to public/demo");
