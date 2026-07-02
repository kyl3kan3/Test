import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { PaywallFooter } from "../../src/components/PaywallFooter";
import {
  presentPaywall,
  purchasesAvailable,
  restorePurchases,
} from "../../src/lib/purchases";
import { useAppState } from "../../src/state/appState";
import { useOnboarding } from "../../src/state/onboarding";

/**
 * Hard paywall — no path into the app without the `pro` entitlement.
 * On device this presents RevenueCat's remote paywall (prices/copy managed in
 * the RC dashboard, incl. full price + renewal term). The screen behind it
 * carries the compliance footer and a sign-in link for existing subscribers.
 */
export default function Paywall() {
  const [busy, setBusy] = useState(false);
  const setPro = useAppState((s) => s.setPro);
  const archetype = useOnboarding((s) => s.archetype)();

  const buy = async () => {
    setBusy(true);
    try {
      const isPro = await presentPaywall();
      if (isPro) {
        setPro(true);
        router.replace("/(app)");
      }
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    const isPro = await restorePurchases();
    if (isPro) {
      setPro(true);
      router.replace("/(app)");
    } else {
      Alert.alert("No purchases found", "No active subscription on this account.");
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="font-body text-sm text-primary uppercase tracking-widest">
          One step left
        </Text>
        <Text className="font-display text-3xl text-ink mt-3 leading-[44px]">
          Unlock your coach
        </Text>
        <Text className="font-body text-base text-ink-dim mt-4 leading-6">
          Your {archetype.name} plan is built. DoTheThing is a paid app — that's
          how the coach stays yours, with no ads and no data selling.
        </Text>
        <View className="mt-8 rounded-2xl bg-surface border border-line p-5">
          {[
            "Unlimited task breakdowns",
            "Live body-double focus sessions",
            "Photo-of-the-mess planning",
            "Streaks with rest-day forgiveness",
          ].map((line) => (
            <Text key={line} className="font-body text-base text-ink py-1.5">
              ✓ {line}
            </Text>
          ))}
        </View>
        {!purchasesAvailable ? (
          <Text className="font-body text-xs text-ink-dim mt-4">
            Store purchases run on the installed app. This build uses a test
            entitlement.
          </Text>
        ) : null}
      </View>
      <Button
        testID="paywall-continue"
        label="See plans & start"
        big
        loading={busy}
        onPress={buy}
      />
      <Text
        testID="paywall-signin"
        className="font-body text-sm text-ink-dim text-center py-3"
        onPress={() => router.push("/(auth)/login")}
      >
        Already subscribed? Sign in
      </Text>
      <PaywallFooter onRestore={restore} />
    </Screen>
  );
}
