import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { api } from "../src/lib/api";
import { useAppState } from "../src/state/appState";

/**
 * Root gate: loading -> onboarding -> paywall -> app.
 * (Signed-out users go through onboarding, which ends in signup.)
 */
export default function Gate() {
  const { me, isPro, setMe } = useAppState();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((m) => setMe(m))
      .catch(() => setMe(null))
      .finally(() => setChecked(true));
  }, [setMe]);

  if (!checked) {
    return (
      <View className="flex-1 items-center justify-center bg-bg" testID="gate-loading">
        <ActivityIndicator color="#FFD9A0" />
      </View>
    );
  }

  if (!me) return <Redirect href="/(onboarding)" />;
  if (!isPro) return <Redirect href="/(auth)/paywall" />;
  return <Redirect href="/(app)" />;
}
