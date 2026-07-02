import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load root .env (written locally / in CI secrets) without a dotenv dependency.
const here = dirname(fileURLToPath(import.meta.url));
for (const candidate of ["../../../.env", "../.env"]) {
  try {
    const env = readFileSync(resolve(here, candidate), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && m[1] && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2];
      }
    }
    break;
  } catch {
    // fine — CI provides env directly
  }
}

const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl) {
  throw new Error("DATABASE_URL_TEST must be set for API tests");
}
process.env.DATABASE_URL = testUrl;

process.env.AI_MODEL = "mock";
process.env.EMAIL_MODE = "log";
process.env.BETTER_AUTH_SECRET = "test-secret-32-bytes-minimum-okay";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.REVENUECAT_WEBHOOK_AUTH = "test-webhook-secret";
process.env.REVENUECAT_SECRET_KEY = "test-rc-key";
process.env.REVENUECAT_API_URL = "https://rc.test";
delete process.env.ENTITLEMENT_BYPASS;
delete process.env.AI_DISABLED;

// Intercept only RevenueCat API calls; everything else (Neon!) passes through.
import { subscriberFixtures } from "./fixtures/revenuecat";

const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input?.url ?? String(input);
  if (url.startsWith("https://rc.test/")) {
    const appUserId = decodeURIComponent(url.split("/v1/subscribers/")[1] ?? "");
    const fixture = subscriberFixtures.get(appUserId);
    if (!fixture) {
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return realFetch(input, init);
}) as typeof fetch;
