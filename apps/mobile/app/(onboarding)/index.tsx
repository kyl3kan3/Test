import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";

export default function Hook() {
  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="font-display text-4xl leading-[52px] text-ink">
          Your brain isn't broken.
        </Text>
        <Text className="font-display text-4xl leading-[52px] text-primary mt-2">
          The mental load is.
        </Text>
        <Text className="font-body text-base text-ink-dim mt-6 leading-6">
          DoTheThing is an AI body-double for ADHD moms carrying it all. It
          breaks the dreaded task into 2-minute steps and sits with you while
          you start — no judgment about the laundry.
        </Text>
      </View>
      <Button
        testID="onboarding-start"
        label="Let's do the thing"
        big
        onPress={() => router.push("/(onboarding)/quiz/0")}
      />
      <Button
        testID="onboarding-login"
        label="I already have an account"
        variant="ghost"
        onPress={() => router.push("/(auth)/login")}
      />
    </Screen>
  );
}
