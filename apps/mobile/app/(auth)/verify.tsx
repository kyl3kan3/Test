import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { cardShadow } from "../../src/lib/cardShadow";
import { Button } from "../../src/components/ui/Button";
import { authClient } from "../../src/lib/authClient";
import { api } from "../../src/lib/api";
import { logInPurchases } from "../../src/lib/purchases";
import { useOnboarding } from "../../src/state/onboarding";
import { useAppState } from "../../src/state/appState";

export default function Verify() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const submitted = useRef(false);
  const { answers, coachTone } = useOnboarding();
  const setMe = useAppState((s) => s.setMe);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (code: string) => {
    if (submitted.current || !email) return;
    submitted.current = true;
    setBusy(true);
    setError(null);

    const { data, error: err } = await authClient.signIn.emailOtp({
      email,
      otp: code,
    });
    if (err || !data) {
      submitted.current = false;
      setBusy(false);
      setError("That code didn't match. Try again?");
      setOtp("");
      return;
    }

    // Alias RevenueCat purchases to our user id before the paywall.
    await logInPurchases(data.user.id).catch(() => {});

    // Sync onboarding answers to the profile (fresh signups).
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await api
      .patchMe({
        coachTone: coachTone(),
        quizAnswers: answers,
        timezone: tz,
        onboarded: true,
      })
      .catch(() => {});

    const me = await api.me().catch(() => null);
    setMe(me);
    setBusy(false);
    router.replace("/(auth)/paywall");
  };

  const onChange = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 6);
    setOtp(clean);
    if (clean.length === 6) verify(clean);
  };

  const resend = async () => {
    if (!email) return;
    setCooldown(30);
    await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="font-display-medium text-2xl text-ink leading-9">
          Check your email
        </Text>
        <Text className="font-body text-base text-ink-dim mt-3">
          We sent a 6-digit code to {email}
        </Text>
        <TextInput
          testID="verify-otp"
          className="mt-8 rounded-2xl bg-card px-5 py-5 font-display-medium text-2xl text-card-ink tracking-[12px] text-center"
          style={cardShadow}
          placeholder="······"
          placeholderTextColor="#B4737D"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={onChange}
          autoFocus
        />
        {error ? (
          <Text className="font-body text-sm text-danger mt-3">{error}</Text>
        ) : null}
      </View>
      <Button
        testID="verify-resend"
        label={cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
        variant="ghost"
        disabled={cooldown > 0 || busy}
        onPress={resend}
      />
    </Screen>
  );
}
