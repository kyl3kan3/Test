import { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Screen } from "../../../src/components/ui/Screen";
import { Button } from "../../../src/components/ui/Button";
import { Chip } from "../../../src/components/ui/Chip";
import { ProgressBar } from "../../../src/components/ProgressBar";
import { QUIZ_STEPS } from "../../../src/quiz";
import { useOnboarding } from "../../../src/state/onboarding";

export default function QuizStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const index = Number(step ?? 0);
  const def = QUIZ_STEPS[index];
  const { answers, setAnswer } = useOnboarding();
  const [multiPick, setMultiPick] = useState<string[]>(
    (answers[def?.key ?? "goal"] as string[] | undefined) ?? [],
  );

  if (!def) return null;

  const advance = () => {
    if (index + 1 < QUIZ_STEPS.length) {
      router.push(`/(onboarding)/quiz/${index + 1}`);
    } else {
      router.push("/(onboarding)/building");
    }
  };

  const pickSingle = (option: string) => {
    setAnswer(def.key, option as never);
    setTimeout(advance, 220); // let the selection state paint before moving on
  };

  const toggleMulti = (option: string) => {
    const next = multiPick.includes(option)
      ? multiPick.filter((o) => o !== option)
      : [...multiPick, option];
    setMultiPick(next);
    setAnswer(def.key, next as never);
  };

  const selectedSingle = answers[def.key] as string | undefined;

  return (
    <Screen>
      <ProgressBar progress={(index + 1) / (QUIZ_STEPS.length + 1)} />
      <Animated.View entering={FadeInDown.duration(360).springify()}>
        <Text className="font-display-medium text-2xl text-ink mt-8 leading-9">
          {def.question}
        </Text>
        {def.sub ? (
          <Text className="font-body text-sm text-ink-dim mt-2">{def.sub}</Text>
        ) : null}
      </Animated.View>
      <View className="mt-8 flex-1">
        {def.options.map((option, i) => (
          <Animated.View key={option} entering={FadeInUp.delay(i * 55).springify()}>
            <Chip
              testID={`quiz-${index}-option-${i}`}
              label={option}
              selected={
                def.multi ? multiPick.includes(option) : selectedSingle === option
              }
              onPress={() => (def.multi ? toggleMulti(option) : pickSingle(option))}
            />
          </Animated.View>
        ))}
      </View>
      {def.multi ? (
        <Button
          testID={`quiz-${index}-next`}
          label="Next"
          big
          disabled={multiPick.length === 0}
          onPress={advance}
        />
      ) : null}
    </Screen>
  );
}
