/**
 * OTP email delivery. EMAIL_MODE=log (default outside production) prints the
 * code to the function log and, when E2E=1, stashes it for the test endpoint.
 * Production uses Resend's HTTP API directly (no SDK dependency).
 */

let lastOtp: { email: string; otp: string } | null = null;

export function getLastOtpForTests(): { email: string; otp: string } | null {
  return lastOtp;
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const mode = process.env.EMAIL_MODE ?? "log";
  if (mode === "log") {
    lastOtp = { email, otp };
    console.log(`[email:log] OTP for ${email}: ${otp}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY / EMAIL_FROM missing with EMAIL_MODE=resend");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `${otp} is your DoTheThing code`,
      text: `Your DoTheThing sign-in code is ${otp}. It expires in 5 minutes.\n\nYou've got this.`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}
