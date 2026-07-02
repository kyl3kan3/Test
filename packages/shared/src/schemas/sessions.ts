import { z } from "zod";

export const startSessionSchema = z.object({
  taskId: z.string().uuid(),
});

export const endSessionSchema = z.object({
  stepsCompleted: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
});

export const createCardSchema = z.object({
  taskId: z.string().uuid().optional(),
  cardType: z.enum(["task_slayed", "before_after", "streak", "wrapped"]),
});
