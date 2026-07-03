import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { durations } from "../lib/motion";

export function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const pct = useSharedValue(clamped);

  useEffect(() => {
    pct.value = withTiming(clamped, { duration: durations.medium });
  }, [clamped, pct]);

  const style = useAnimatedStyle(() => ({ width: `${pct.value * 100}%` }));

  return (
    <View className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
      <Animated.View className="h-full rounded-full bg-primary" style={style} />
    </View>
  );
}
