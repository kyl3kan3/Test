import { useState } from "react";
import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { Chip } from "../../src/components/ui/Chip";
import { api } from "../../src/lib/api";
import { authClient } from "../../src/lib/authClient";
import { restorePurchases } from "../../src/lib/purchases";
import { useAppState } from "../../src/state/appState";
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from "../../src/lib/env";
import { cardShadow } from "../../src/lib/cardShadow";

const TONES = [
  { value: "gentle_cheerleader", label: "Gentle hype" },
  { value: "chaotic_bestie", label: "Chaotic bestie" },
  { value: "calm_steady", label: "Calm & steady" },
];

export default function Settings() {
  const { me, setMe, setPro } = useAppState();
  const [tone, setTone] = useState(me?.coachTone ?? "gentle_cheerleader");

  const pickTone = async (value: string) => {
    setTone(value);
    await api.patchMe({ coachTone: value }).catch(() => {});
  };

  const manageSubscription = () => {
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    Linking.openURL(url);
  };

  const signOut = async () => {
    await authClient.signOut().catch(() => {});
    // Note: we intentionally do NOT log out RevenueCat into a new anonymous
    // user — the next sign-in calls logIn() with the new user id.
    setMe(null);
    setPro(false);
    router.replace("/(onboarding)");
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently removes your tasks, streaks and history. Your subscription must be cancelled separately in the store.",
      [
        { text: "Keep my account", style: "cancel" },
        {
          text: "Delete forever",
          style: "destructive",
          onPress: async () => {
            await api.deleteMe().catch(() => {});
            setMe(null);
            setPro(false);
            router.replace("/(onboarding)");
          },
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <Pressable testID="settings-back" onPress={() => router.back()}>
        <Text className="font-body text-base text-ink-dim">← Back</Text>
      </Pressable>

      <Text className="font-display-medium text-2xl text-ink mt-6">Settings</Text>
      <Text className="font-body text-sm text-ink-dim mt-1">{me?.email}</Text>

      <Text className="font-body-semibold text-sm text-ink-dim uppercase tracking-widest mt-10 mb-3">
        Coach tone
      </Text>
      {TONES.map((t) => (
        <Chip
          key={t.value}
          testID={`settings-tone-${t.value}`}
          label={t.label}
          selected={tone === t.value}
          onPress={() => pickTone(t.value)}
        />
      ))}

      <Text className="font-body-semibold text-sm text-ink-dim uppercase tracking-widest mt-8 mb-3">
        Subscription
      </Text>
      <View className="gap-3">
        <Button
          testID="settings-manage-sub"
          label="Manage subscription"
          variant="surface"
          onPress={manageSubscription}
        />
        <Button
          testID="settings-restore"
          label="Restore purchases"
          variant="surface"
          onPress={async () => {
            const isPro = await restorePurchases();
            Alert.alert(isPro ? "Restored!" : "No purchases found");
          }}
        />
      </View>

      <Text className="font-body-semibold text-sm text-ink-dim uppercase tracking-widest mt-8 mb-3">
        Legal & support
      </Text>
      <View className="rounded-2xl bg-card" style={cardShadow}>
        {[
          { label: "Terms of Use", action: () => Linking.openURL(TERMS_URL) },
          { label: "Privacy Policy", action: () => Linking.openURL(PRIVACY_URL) },
          {
            label: "Email support",
            action: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
          },
        ].map((row, i) => (
          <Pressable
            key={row.label}
            onPress={row.action}
            className={`px-5 py-4 ${i > 0 ? "border-t border-card-dim/20" : ""}`}
          >
            <Text className="font-body text-base text-card-ink">{row.label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-8 gap-3">
        <Button testID="settings-signout" label="Sign out" variant="surface" onPress={signOut} />
        <Button
          testID="settings-delete"
          label="Delete account"
          variant="danger"
          onPress={deleteAccount}
        />
      </View>
    </Screen>
  );
}
