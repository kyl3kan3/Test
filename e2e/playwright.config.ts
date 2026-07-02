import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load Neon test-branch URL from root .env (or CI env).
function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const env = readFileSync(resolve(__dirname, "../.env"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && m[1]) out[m[1]] = m[2] ?? "";
    }
  } catch {
    // CI provides env directly
  }
  return out;
}
const fileEnv = loadEnv();
const DATABASE_URL_TEST =
  process.env.DATABASE_URL_TEST ?? fileEnv.DATABASE_URL_TEST ?? "";

export default defineConfig({
  testDir: "./flows",
  timeout: 60_000,
  retries: 1,
  workers: 1, // flows share one DB + one OTP mailbox
  use: {
    baseURL: "http://localhost:8788",
    ...devices["iPhone 14"],
    // iPhone device profile uses WebKit by default; the preinstalled browser
    // here is Chromium, so emulate the viewport on Chromium instead.
    defaultBrowserType: "chromium",
    // CI/container images ship a fixed Chromium; never download browsers.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : process.env.PLAYWRIGHT_BROWSERS_PATH
        ? { executablePath: "/opt/pw-browsers/chromium" }
        : undefined,
  },
  webServer: [
    {
      command: "npx tsx apps/api/src/devServer.ts",
      cwd: resolve(__dirname, ".."),
      port: 3000,
      reuseExistingServer: true,
      env: {
        DATABASE_URL: DATABASE_URL_TEST,
        AI_MODEL: "mock",
        EMAIL_MODE: "log",
        E2E: "1",
        ENTITLEMENT_BYPASS: "1",
        BETTER_AUTH_SECRET: "e2e-secret-32-bytes-minimum-okay!",
        BETTER_AUTH_URL: "http://localhost:3000",
        REVENUECAT_WEBHOOK_AUTH: "e2e-webhook",
        REVENUECAT_SECRET_KEY: "e2e-rc-key",
      },
    },
    {
      command: "node e2e/static-server.mjs apps/mobile/dist",
      cwd: resolve(__dirname, ".."),
      port: 8788,
      reuseExistingServer: true,
    },
  ],
});
