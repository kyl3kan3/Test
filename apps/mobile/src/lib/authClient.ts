import { Platform } from "react-native";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { API_URL } from "./env";

function nativePlugins(): never[] {
  if (Platform.OS === "web") return [];
  // Native: SecureStore-backed session via the Expo plugin.
  const { expoClient } = require("@better-auth/expo/client");
  const SecureStore = require("expo-secure-store");
  return [
    expoClient({
      scheme: "dothething",
      storagePrefix: "dtt",
      storage: SecureStore,
    }),
  ] as never[];
}

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: "/api/auth",
  plugins: [emailOTPClient(), ...nativePlugins()],
});

/** Cookie header for API calls. Empty on web (browser sends cookies itself). */
export function sessionCookie(): string {
  if (Platform.OS === "web") return "";
  const anyClient = authClient as unknown as { getCookie?: () => string };
  return anyClient.getCookie?.() ?? "";
}
