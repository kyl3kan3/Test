import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { haptics } from "../lib/haptics";

/**
 * Count-UP step timer — never a punitive countdown. Soft haptic once when the
 * estimate passes; keeps counting calmly after.
 */
export function Timer({
  seconds,
  estimatedSeconds,
}: {
  seconds: number;
  estimatedSeconds: number;
}) {
  const buzzed = useRef(false);

  useEffect(() => {
    if (!buzzed.current && seconds >= estimatedSeconds && estimatedSeconds > 0) {
      buzzed.current = true;
      haptics.soft();
    }
  }, [seconds, estimatedSeconds]);

  useEffect(() => {
    buzzed.current = false;
  }, [estimatedSeconds]);

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  const past = seconds >= estimatedSeconds;

  return (
    <View className="items-center">
      <Text
        testID="session-timer"
        className={`font-display text-5xl ${past ? "text-ink-dim" : "text-ink"}`}
      >
        {mm}:{ss}
      </Text>
      <Text className="font-body text-xs text-ink-dim mt-2">
        {past ? "no rush — still counts" : `aiming for ~${Math.max(1, Math.round(estimatedSeconds / 60))} min`}
      </Text>
    </View>
  );
}
