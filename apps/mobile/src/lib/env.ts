export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const IS_E2E = process.env.EXPO_PUBLIC_E2E === "1";

/** Public web demo: the whole backend is faked in-memory in the browser. */
export const IS_DEMO = process.env.EXPO_PUBLIC_DEMO === "1";

export const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "";
export const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "";

export const TERMS_URL = "https://dothething.app/terms";
export const PRIVACY_URL = "https://dothething.app/privacy";
export const SUPPORT_EMAIL = "support@dothething.app";
