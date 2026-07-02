import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { durations } from "../lib/motion";

/**
 * Twin breathing rings around the session timer, synced to a 6-second
 * box-breathing cadence — calm by entrainment, not decoration.
 */
function Ring({ color, offset }: { color: string; offset: number }) {
  const t = useSharedValue(offset);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: durations.breath, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + t.value * 0.14 }],
    opacity: 0.45 + t.value * 0.55,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute inset-0 rounded-full border"
      style={[{ borderColor: color, borderWidth: 1.5 }, style]}
    />
  );
}

export function BreathingOrbit({
  seconds,
  past,
}: {
  seconds: number;
  past: boolean;
}) {
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <View className="h-52 w-52 items-center justify-center self-center">
      <Ring color="rgba(139,124,255,0.5)" offset={0} />
      <Ring color="rgba(125,211,252,0.28)" offset={0.5} />
      <View
        className="h-44 w-44 items-center justify-center rounded-full bg-surface"
        style={{
          shadowColor: "#5B4BE0",
          shadowOpacity: 0.5,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <Text
          testID="session-timer"
          className={`font-display text-5xl ${past ? "text-ink-dim" : "text-ink"}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {mm}:{ss}
        </Text>
      </View>
    </View>
  );
}
