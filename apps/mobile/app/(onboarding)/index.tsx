import { Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { Aurora } from "../../src/components/Aurora";

export default function Hook() {
  return (
    <Screen>
      <Aurora />
      <View className="flex-1 justify-center">
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <Text className="font-display text-4xl leading-[52px] text-ink">
            Your brain isn't broken.
          </Text>
          <Text className="font-display text-4xl leading-[52px] text-primary mt-2">
            The mental load never clocks out.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(250).duration(450).springify()}>
          <Text className="font-body text-base text-ink-dim mt-6 leading-6">
            DoTheThing is an AI body-double for ADHD moms running the whole
            operation — permission slips, the school portal, meal planning, the
            class group chat that won't stop pinging. It turns whatever you're
            dreading into the next two-minute step and starts it with you. No
            judgment about the laundry pile, the unread email, or anything else
            on the list — just a way in.
          </Text>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInUp.delay(450).duration(450).springify()}>
        <Button
          testID="onboarding-start"
          label="Let's do the thing"
          big
          pulse
          onPress={() => router.push("/(onboarding)/quiz/0")}
        />
        <Button
          testID="onboarding-login"
          label="I already have an account"
          variant="ghost"
          onPress={() => router.push("/(auth)/login")}
        />
      </Animated.View>
    </Screen>
  );
}
