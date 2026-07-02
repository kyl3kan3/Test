# ⚡ DoTheThing

**The AI body-double for ADHD brains.** Name the task you're dreading (or photograph the mess) → get a plan of comically small 2-minute steps → a live AI coach talks you through actually starting → celebrate with a shareable "I did the thing" card. Streaks forgive rest days. Nothing is free — hard paywall via RevenueCat.

## Why this app

Market research (June–July 2026) found ADHD "task paralysis" to be the strongest underserved consumer niche: 40K+/mo searches with under 10 weak competitors, documented $5–15/mo willingness to pay, a massive identity-driven ADHD TikTok community for distribution, and a recurring daily behavior (retention, not a one-shot novelty). The product design follows the proven viral-app playbook: quiz onboarding → hard paywall (10.7% download-to-paid vs 2.1% freemium), 5-second demoable AI result, screenshot-worthy 9:16 share cards, streaks with forgiveness.

## Architecture

```
apps/mobile     Expo SDK 57 (React Native 0.86, expo-router, NativeWind, Reanimated)
                RevenueCat hard paywall · Better Auth email OTP · streaming AI coach
apps/api        Hono on Vercel Functions (Node) · Better Auth · AI SDK 7
                provider-agnostic AI (Anthropic ⇄ OpenAI via AI_MODEL env)
packages/shared Drizzle schema · zod schemas · prompts · design tokens · limits
Neon Postgres   users, tasks, micro-steps, sessions, streaks, subscriptions
RevenueCat      subscriptions; webhook → idempotent sync into Postgres
```

## Development

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm test   # unit + integration (needs DATABASE_URL_TEST)
pnpm e2e                                   # Playwright vs the Expo web export
cd apps/mobile && npx expo start           # dev client on device
```

See **docs/SETUP.md** for environment variables and account setup, and
**docs/STORE_CHECKLIST.md** for the App Store / Play Store submission path.
