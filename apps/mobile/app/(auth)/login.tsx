import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { authClient } from "../../src/lib/authClient";

/** Returning-user entry (also linked from the paywall for App Review). */
export default function Login() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim().toLowerCase(),
      type: "sign-in",
    });
    setBusy(false);
    if (err) {
      setError("Couldn't send the code. Double-check the email?");
      return;
    }
    router.push({
      pathname: "/(auth)/verify",
      params: { email: email.trim().toLowerCase() },
    });
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="font-display-medium text-2xl text-ink">Welcome back</Text>
        <Text className="font-body text-base text-ink-dim mt-3">
          We'll email you a sign-in code.
        </Text>
        <TextInput
          testID="login-email"
          className="mt-8 rounded-2xl bg-surface border border-line px-5 py-4 font-body text-base text-ink"
          placeholder="you@example.com"
          placeholderTextColor="#9A9AB0"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {error ? (
          <Text className="font-body text-sm text-danger mt-3">{error}</Text>
        ) : null}
      </View>
      <Button
        testID="login-send"
        label="Email me a code"
        big
        loading={busy}
        disabled={!email.includes("@")}
        onPress={send}
      />
    </Screen>
  );
}
