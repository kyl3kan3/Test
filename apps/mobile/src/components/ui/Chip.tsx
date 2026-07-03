import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { haptics } from "../../lib/haptics";
import { springs } from "../../lib/motion";

export function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withSpring(1.04, springs.pop),
        withSpring(1, springs.snappy),
      );
    }
  }, [selected, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPressIn={() => {
          scale.value = withSpring(0.97, springs.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.snappy);
        }}
        onPress={() => {
          haptics.select();
          onPress();
        }}
        className={`rounded-2xl border px-5 py-4 mb-3 ${
          selected ? "border-primary bg-primary/15" : "border-line bg-surface"
        }`}
      >
        <Text
          className={`font-body-medium text-base ${selected ? "text-primary" : "text-ink"}`}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
