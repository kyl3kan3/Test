import { z } from "zod";

export const taskStatusSchema = z.enum([
  "ready",
  "in_progress",
  "done",
  "abandoned",
]);

export const patchTaskSchema = z.object({
  status: taskStatusSchema,
});

export const stepStatusSchema = z.enum(["todo", "done", "skipped"]);

export const patchStepSchema = z.object({
  status: stepStatusSchema,
});

export const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
});
