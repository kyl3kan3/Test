import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { generateObject, streamText, convertToModelMessages } from "ai";
import { and, asc, eq } from "drizzle-orm";
import {
  breakdownRequestSchema,
  breakdownSchema,
  photoPlanRequestSchema,
  photoPlanSchema,
  sessionContextSchema,
} from "@dtt/shared/schemas/ai";
import { MAX_PHOTO_BASE64_BYTES } from "@dtt/shared/limits";
import {
  breakdownSystemPrompt,
  chatSystemPrompt,
  photoPlanSystemPrompt,
  type CoachTone,
} from "@dtt/shared/prompts";
import { z } from "zod";
import { db, schema } from "../db";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requirePro } from "../middleware/entitlement";
import { rateLimit } from "../middleware/rateLimit";
import { aiDisabled, getModel, modelLabel } from "../lib/ai";
import { logAiUsage } from "../lib/usage";

export const aiRoutes = new Hono<AuthEnv>();

aiRoutes.use("*", requireAuth, requirePro);

function coachTone(v: string | null): CoachTone | null {
  return v === "gentle_cheerleader" || v === "chaotic_bestie" || v === "calm_steady"
    ? v
    : null;
}

async function persistBreakdown(opts: {
  userId: string;
  title: string;
  source: "text" | "photo";
  vibeCheck: string;
  observations?: string[];
  steps: { title: string; detail: string; estimatedSeconds: number }[];
}) {
  const [task] = await db
    .insert(schema.tasks)
    .values({
      userId: opts.userId,
      title: opts.title,
      source: opts.source,
      vibeCheck: opts.vibeCheck,
      observations: opts.observations ?? null,
    })
    .returning();
  if (!task) throw new Error("task insert failed");

  const steps = await db
    .insert(schema.microSteps)
    .values(
      opts.steps.map((s, i) => ({
        taskId: task.id,
        orderIndex: i,
        title: s.title,
        detail: s.detail,
        estimatedSeconds: s.estimatedSeconds,
      })),
    )
    .returning();

  return { ...task, steps };
}

aiRoutes.post("/breakdown", rateLimit("breakdown"), zValidator("json", breakdownRequestSchema), async (c) => {
  if (aiDisabled()) return c.json({ error: "ai_disabled" }, 503);
  const user = c.get("user");
  const body = c.req.valid("json");

  // Splitting an existing step is a smaller job — run it on the cheap model.
  let splitContext = "";
  if (body.splitStepId) {
    const [step] = await db
      .select()
      .from(schema.microSteps)
      .where(eq(schema.microSteps.id, body.splitStepId))
      .limit(1);
    if (step) {
      splitContext = `\nThe user found this step too big — break IT down even smaller (2-4 tiny steps): "${step.title}" (${step.detail ?? ""})`;
    }
  }

  const modelKind = body.splitStepId ? "cheap" : "main";
  const result = await generateObject({
    model: getModel(modelKind),
    schema: breakdownSchema,
    system: breakdownSystemPrompt({
      tone: coachTone(user.coachTone),
      energyLevel: body.energyLevel,
    }),
    prompt: [
      `Dreaded task: ${body.title}`,
      body.context ? `Extra context: ${body.context}` : "",
      splitContext,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  await logAiUsage({
    userId: user.id,
    endpoint: "breakdown",
    model: modelLabel(modelKind),
    usage: result.usage,
  });

  const task = await persistBreakdown({
    userId: user.id,
    title: result.object.taskSummary,
    source: "text",
    vibeCheck: result.object.vibeCheck,
    steps: result.object.steps,
  });
  return c.json(task, 201);
});

aiRoutes.post("/photo-plan", rateLimit("photo_plan"), zValidator("json", photoPlanRequestSchema), async (c) => {
  if (aiDisabled()) return c.json({ error: "ai_disabled" }, 503);
  const user = c.get("user");
  const body = c.req.valid("json");

  if (body.imageBase64.length > MAX_PHOTO_BASE64_BYTES) {
    return c.json(
      { error: "image_too_large", maxBytes: MAX_PHOTO_BASE64_BYTES },
      413,
    );
  }

  const result = await generateObject({
    model: getModel("main"),
    schema: photoPlanSchema,
    system: photoPlanSystemPrompt({
      tone: coachTone(user.coachTone),
      energyLevel: body.energyLevel,
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: body.hint
              ? `Here is a photo of my space. Hint: ${body.hint}`
              : "Here is a photo of my space. Help me get started.",
          },
          {
            type: "image",
            image: body.imageBase64,
            mediaType: body.mimeType,
          },
        ],
      },
    ],
  });

  await logAiUsage({
    userId: user.id,
    endpoint: "photo_plan",
    model: modelLabel("main"),
    usage: result.usage,
  });

  const task = await persistBreakdown({
    userId: user.id,
    title: result.object.taskSummary,
    source: "photo",
    vibeCheck: result.object.vibeCheck,
    observations: result.object.observations,
    steps: result.object.steps,
  });
  return c.json(task, 201);
});

const chatBodySchema = z.object({
  messages: z.array(z.any()).min(1).max(60),
  sessionContext: sessionContextSchema,
});

aiRoutes.post("/chat", rateLimit("chat"), zValidator("json", chatBodySchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  const ctx = body.sessionContext;

  if (aiDisabled()) {
    return c.json({ error: "ai_disabled", message: "The coach is napping — keep going, you're doing great." }, 503);
  }

  // Verify the session's task belongs to this user before coaching on it.
  const [task] = await db
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, ctx.taskId), eq(schema.tasks.userId, user.id)))
    .limit(1);
  if (!task) return c.json({ error: "not_found" }, 404);

  const result = streamText({
    model: getModel("main"),
    system: chatSystemPrompt({
      tone: coachTone(user.coachTone),
      taskTitle: ctx.taskTitle,
      stepTitle: ctx.stepTitle,
      stepIndex: ctx.stepIndex,
      stepCount: ctx.stepCount,
      secondsElapsed: ctx.secondsElapsed,
    }),
    messages: await convertToModelMessages(body.messages),
    maxOutputTokens: 120,
    onFinish: async ({ usage }) => {
      await logAiUsage({
        userId: user.id,
        endpoint: "chat",
        model: modelLabel("main"),
        usage,
      });
    },
  });

  return result.toUIMessageStreamResponse();
});

/** Fetch the full task (with steps) for a breakdown just created. */
export async function getTaskWithSteps(taskId: string, userId: string) {
  const [task] = await db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
    .limit(1);
  if (!task) return null;
  const steps = await db
    .select()
    .from(schema.microSteps)
    .where(eq(schema.microSteps.taskId, taskId))
    .orderBy(asc(schema.microSteps.orderIndex));
  return { ...task, steps };
}
