import { z } from "zod";

export const breakdownSchema = z.object({
  taskSummary: z.string().max(80),
  /** One validating sentence about why this task feels hard. */
  vibeCheck: z.string().max(140),
  steps: z
    .array(
      z.object({
        /** Imperative, physical: "Put on shoes" */
        title: z.string().max(60),
        detail: z.string().max(140),
        estimatedSeconds: z.number().int().min(30).max(180),
      }),
    )
    .min(3)
    .max(8),
});
export type Breakdown = z.infer<typeof breakdownSchema>;

export const photoPlanSchema = breakdownSchema.extend({
  /** Strictly neutral inventory of what's visible in the photo. */
  observations: z.array(z.string().max(80)).max(4),
});
export type PhotoPlan = z.infer<typeof photoPlanSchema>;

export const breakdownRequestSchema = z.object({
  title: z.string().min(1).max(200),
  context: z.string().max(500).optional(),
  energyLevel: z.number().int().min(1).max(3).optional(),
  /** When set, re-split this existing step into smaller pieces (cheap model). */
  splitStepId: z.string().uuid().optional(),
});
export type BreakdownRequest = z.infer<typeof breakdownRequestSchema>;

export const photoPlanRequestSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  hint: z.string().max(200).optional(),
  energyLevel: z.number().int().min(1).max(3).optional(),
});
export type PhotoPlanRequest = z.infer<typeof photoPlanRequestSchema>;

export const sessionContextSchema = z.object({
  taskId: z.string().uuid(),
  taskTitle: z.string().max(200),
  stepTitle: z.string().max(200),
  stepIndex: z.number().int().min(0),
  stepCount: z.number().int().min(1),
  secondsElapsed: z.number().int().min(0),
});
export type SessionContext = z.infer<typeof sessionContextSchema>;
