# App Store / Play Store Submission Checklist

## Hard-paywall compliance (why reviews fail — all handled in code, verify before submit)

- [x] **Restore Purchases** button on the paywall (`PaywallFooter`) and in Settings
- [x] **Terms of Use + Privacy Policy links** inside the app (paywall footer + Settings) and hosted at `/terms.html`, `/privacy.html`
- [ ] **Full price + renewal term** visible on the RevenueCat paywall template — toggle ON in the RC dashboard and verify in a screenshot before submitting
- [x] **Sign-in path for existing subscribers** on the paywall ("Already subscribed? Sign in")
- [x] **Account deletion** in Settings (Apple requirement for apps with accounts)
- [ ] **Reviewer notes**: explain the app is fully paid; provide a sandbox Apple ID or note that sandbox purchases work on the paywall; include a demo video of the core loop

## App Store Connect

- [ ] Subscription group + products: `pro_monthly` $6.99/mo, `pro_yearly` $39.99/yr with 3-day trial (match RC offering)
- [ ] Privacy nutrition labels: Email address (account), Photos (app functionality, not linked to identity, not stored), Usage data (analytics/rate limiting), Purchases
- [ ] App category: Productivity; secondary: Health & Fitness (do NOT claim medical benefit)
- [ ] Screenshots: 9:16 of home ("What are you dreading?"), breakdown, session, celebration card, streak
- [ ] Marketing text avoids medical claims — "designed for ADHD brains", never "treats ADHD"; primary audience framing is "ADHD moms", not a clinical claim

## Play Console

- [ ] Same subscription products; license testers added for sandbox
- [ ] New personal accounts: 12-tester/14-day closed test before production
- [ ] Data safety form mirrors the privacy labels above

## Pre-submission smoke test (device build)

- [ ] Fresh install → quiz → OTP email arrives (Resend configured) → paywall
- [ ] Sandbox purchase succeeds → app unlocks → webhook wrote a `subscriptions` row (check Neon)
- [ ] Breakdown + photo plan + session coach streaming work against prod API
- [ ] Share card exports to the share sheet with watermark
- [ ] Restore Purchases works after reinstall
- [ ] Delete account removes data and returns to onboarding

## Launch-week growth (from the viral-app research)

- [ ] Recruit 20–60 ADHD-mom micro-creators (#adhdmom, #momtok, #adhdparenting; pick by view-to-follower ratio); pay per post ($50–150) with usage rights
- [ ] 2–3 proven hook formats, repeated at volume: "POV: you've had 'reply to the class group chat' on your to-do list since Tuesday" / "Rating my kid's permission slips by how many days late I was signing them" / "Body-doubling my most ADHD-mom task: the pile of art projects I can't throw away or display"
- [ ] Every celebration card carries the wordmark + dothething.app — the share card IS the ad
- [ ] Set up RevenueCat charts: trial starts, trial→paid conversion (healthy: 25–50%), D7 retention
