import { z } from "zod";

export const coachToneSchema = z.enum([
  "gentle_cheerleader",
  "chaotic_bestie",
  "calm_steady",
]);

export const quizAnswersSchema = z.object({
  diagnosis: z.string().max(60).optional(),
  paralysisFrequency: z.string().max(60).optional(),
  worstTaskTypes: z.array(z.string().max(40)).max(8).optional(),
  triedBefore: z.array(z.string().max(40)).max(8).optional(),
  hypeStyle: z.string().max(60).optional(),
  peakDreadTime: z.string().max(30).optional(),
  goal: z.string().max(120).optional(),
});
export type QuizAnswers = z.infer<typeof quizAnswersSchema>;

export const patchMeSchema = z.object({
  coachTone: coachToneSchema.optional(),
  quizAnswers: quizAnswersSchema.optional(),
  timezone: z.string().max(60).optional(),
  onboarded: z.boolean().optional(),
});
export type PatchMe = z.infer<typeof patchMeSchema>;
