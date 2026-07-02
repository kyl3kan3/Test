import { db, schema } from "../db";
import type { AiEndpoint } from "@dtt/shared/limits";

/** Normalize AI SDK usage (flat or nested) to plain token counts. */
export function usageTokens(usage: unknown): { input: number; output: number } {
  const u = usage as Record<string, any> | undefined;
  if (!u) return { input: 0, output: 0 };
  const input =
    typeof u.inputTokens === "number"
      ? u.inputTokens
      : (u.inputTokens?.total ?? 0);
  const output =
    typeof u.outputTokens === "number"
      ? u.outputTokens
      : (u.outputTokens?.total ?? 0);
  return { input: input ?? 0, output: output ?? 0 };
}

export async function logAiUsage(opts: {
  userId: string;
  endpoint: AiEndpoint;
  model: string;
  usage: unknown;
}): Promise<void> {
  const { input, output } = usageTokens(opts.usage);
  try {
    await db.insert(schema.aiUsage).values({
      userId: opts.userId,
      endpoint: opts.endpoint,
      model: opts.model,
      inputTokens: input,
      outputTokens: output,
    });
  } catch (err) {
    // Usage logging must never fail the user-facing request.
    console.error("ai_usage insert failed", err);
  }
}
