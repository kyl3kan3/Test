import { Linking, Text, View } from "react-native";
import { PRIVACY_URL, TERMS_URL } from "../lib/env";

/**
 * App Review compliance strip rendered under every paywall variant:
 * Restore Purchases + Terms + Privacy must be reachable behind a hard paywall.
 */
export function PaywallFooter({ onRestore }: { onRestore: () => void }) {
  return (
    <View className="items-center pt-4 pb-2">
      <Text
        testID="paywall-restore"
        accessibilityRole="button"
        className="font-body-medium text-sm text-ink-dim py-2"
        onPress={onRestore}
      >
        Restore Purchases
      </Text>
      <View className="flex-row gap-6 mt-1">
        <Text
          testID="paywall-terms"
          accessibilityRole="link"
          className="font-body text-xs text-ink-dim underline"
          onPress={() => Linking.openURL(TERMS_URL)}
        >
          Terms of Use
        </Text>
        <Text
          testID="paywall-privacy"
          accessibilityRole="link"
          className="font-body text-xs text-ink-dim underline"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        >
          Privacy Policy
        </Text>
      </View>
    </View>
  );
}
