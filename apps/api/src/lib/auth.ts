import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { db, schema } from "../db";
import { sendOtpEmail } from "./email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    additionalFields: {
      coachTone: { type: "string", required: false },
      timezone: { type: "string", required: false },
    },
  },
  emailAndPassword: { enabled: false },
  plugins: [
    expo(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],
  trustedOrigins: [
    "dothething://",
    "dothething://*",
    "http://localhost:8081", // expo dev server
    "http://localhost:8788", // e2e web export
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    "https://*.vercel.app", // preview deployments
  ],
});
