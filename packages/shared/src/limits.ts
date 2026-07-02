/**
 * Per-user daily AI rate limits (UTC day window) — caps API spend and gives the
 * client a number to show in friendly "the coach is resting" states.
 */
export const AI_DAILY_LIMITS = {
  breakdown: 25,
  photo_plan: 10,
  chat: 300,
} as const;

export type AiEndpoint = keyof typeof AI_DAILY_LIMITS;

/** Max base64 payload accepted by /api/ai/photo-plan (bytes of base64 text). */
export const MAX_PHOTO_BASE64_BYTES = 3 * 1024 * 1024;

/** Client-side compression targets for the photo path. */
export const PHOTO_MAX_DIMENSION = 1568;
export const PHOTO_JPEG_QUALITY = 0.7;
