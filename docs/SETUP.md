# DoTheThing — Setup Guide

Everything the code needs to run, and where each key goes.

## 1. What's already provisioned

| Thing | Value |
|---|---|
| **Neon project (production)** | `ADHDApp` (id `cool-rain-75506757`, Vercel-managed org, aws-us-east-1) — attached to the Vercel project via the Neon integration; `DATABASE_URL` is auto-injected into Vercel |
| Neon branches | `main` (production) + `test` (`br-summer-frost-ah5hocrh`, integration tests / e2e) |
| Schema | Applied via `drizzle-kit migrate` (`apps/api/drizzle/`); all 31 API tests green against the test branch |
| Vercel project | `test` (`prj_hQ217OFrNusWcmOwsuD3XSYWEzcq`), git-integrated with `kyl3kan3/Test`; production domain `https://test-kyl3kan3-6147s-projects.vercel.app` (deploys `main`; PR branches get preview deployments) |
| (deprecated) Neon project `dothething` | `quiet-glitter-59483542` — superseded by ADHDApp; safe to delete in the Neon console |
| RevenueCat project | `DoTheThing` (project id `proj53d6a450`) |
| RC apps | iOS `app19619b61bf` (bundle `app.dothething.mobile`), Android `appe726220701` |
| RC products | iOS: `pro_yearly`, `pro_monthly` · Android: `pro_yearly:annual`, `pro_monthly:monthly` |
| RC offering | `default` (current) with `$rc_annual` (highlighted) + `$rc_monthly` packages, products attached for both stores |
| RC public SDK keys | Already wired into `apps/mobile/eas.json` (public keys — meant to ship in the binary) |

**One manual RevenueCat step remains** (the connector token lacked the entitlements scope):
in the RC dashboard → Project settings → Entitlements → create entitlement with identifier **`pro`**,
then attach all four products to it. Everything else RC-side is done.

## 2. Environment variables

### Vercel project (`apps/api`) — production

| Variable | Value / where to get it |
|---|---|
| `DATABASE_URL` | Neon **main** branch pooled connection string (Neon console → Connect) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://<your-api-domain>` |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `OPENAI_API_KEY` | (optional) platform.openai.com |
| `AI_MODEL` | `anthropic:claude-sonnet-5` (swap to `openai:gpt-5.4` any time) |
| `AI_MODEL_CHEAP` | `anthropic:claude-haiku-4-5` |
| `RESEND_API_KEY` + `EMAIL_FROM` | resend.com (verify a sending domain); until set, use `EMAIL_MODE=log` |
| `EMAIL_MODE` | `resend` in production (`log` prints OTPs to function logs) |
| `REVENUECAT_SECRET_KEY` | RevenueCat dashboard → API keys (secret) |
| `REVENUECAT_WEBHOOK_AUTH` | any random string; set the SAME value in RC webhook config |

### Mobile builds (`apps/mobile` via `eas.json` env or EAS secrets)

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://<your-api-domain>` |
| `EXPO_PUBLIC_RC_IOS_KEY` | RevenueCat public Apple SDK key (`appl_…`) |
| `EXPO_PUBLIC_RC_ANDROID_KEY` | RevenueCat public Google SDK key (`goog_…`) |

### Local / CI

Root `.env` (gitignored):
```
DATABASE_URL=<neon main pooled url>
DATABASE_URL_TEST=<neon test-branch pooled url>
```
GitHub Actions secret: `DATABASE_URL_TEST` (used by API tests + e2e).

## 3. Accounts you must create (in order)

1. **Apple Developer Program** ($99/yr — start first, enrollment takes days).
   Create the app record (bundle id `app.dothething.mobile`), a subscription
   group with `pro_monthly` ($6.99/mo) and `pro_yearly` ($39.99/yr, 3-day free
   trial), and an App Store Connect API key for EAS submit.
2. **Google Play Console** ($25 one-time). Same product ids; service-account
   JSON shared with RevenueCat and EAS.
3. **RevenueCat** — mostly done already (see §1). Remaining dashboard steps:
   1. Create entitlement **`pro`** and attach all four products (connector scope
      blocked this one call).
   2. Review + **publish** the AI-generated paywall draft
      ([builder link](https://app.revenuecat.com/projects/53d6a450/paywalls/pw195c163e44c74925/builder),
      paywall id `pw195c163e44c74925`) and attach it to the `default` offering.
      Consider removing the close (X) button — this is a hard paywall (the app
      gates on entitlement either way, but no-X converts better).
   3. Add the **webhook** once the API is deployed:
      `https://<api-domain>/api/webhooks/revenuecat`, auth header = the value
      you set as `REVENUECAT_WEBHOOK_AUTH` on Vercel.
   4. After Apple/Google accounts exist: upload App Store Connect API key +
      Play service-account JSON in RC app settings, and create the store
      products with matching identifiers.
4. **Expo/EAS**: `npm i -g eas-cli && eas login && eas init` inside
   `apps/mobile` (writes `extra.eas.projectId`).
5. **Resend** for OTP email, **domain** `dothething.app` (Terms/Privacy pages
   are served by the API at `/terms.html` and `/privacy.html`).

## 4. Build & run on device

```bash
cd apps/mobile
eas build --profile development --platform ios   # cloud build, no Mac needed
# install on device, then:
npx expo start --dev-client
```

Sandbox-test the purchase loop end-to-end (device build + App Store sandbox
tester), confirm the webhook writes a `subscriptions` row, then:

```bash
eas build --profile production --platform all
eas submit
```

## 5. Useful commands

```bash
pnpm --filter @dtt/api test        # 31 integration tests vs Neon test branch
pnpm --filter @dtt/mobile test     # jest-expo unit tests
pnpm e2e                           # full-journey Playwright tests
pnpm check-lockstep                # AI SDK major-version guard
cd apps/api && pnpm db:generate    # new migration after schema change
```
