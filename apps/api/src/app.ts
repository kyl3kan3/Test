import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { meRoutes } from "./routes/me";
import { aiRoutes } from "./routes/ai";
import { stepRoutes, taskRoutes } from "./routes/tasks";
import { cardRoutes, sessionRoutes } from "./routes/sessions";
import { streakRoutes } from "./routes/streaks";
import { recapRoutes } from "./routes/recap";
import { webhookRoutes } from "./routes/webhooks";
import { testOnlyRoutes } from "./routes/testOnly";

export const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/api/health", (c) =>
  c.json({ ok: true, service: "dothething-api", time: new Date().toISOString() }),
);

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/me", meRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/tasks", taskRoutes);
app.route("/api/steps", stepRoutes);
app.route("/api/sessions", sessionRoutes);
app.route("/api/cards", cardRoutes);
app.route("/api/streak", streakRoutes);
app.route("/api/recap", recapRoutes);
app.route("/api/webhooks", webhookRoutes);

if (process.env.E2E === "1") {
  app.route("/api/test", testOnlyRoutes);
}

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "internal_error" }, 500);
});
