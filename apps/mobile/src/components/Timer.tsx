import { useEffect, useRef } from "react";
import { View } from "react-native";
import { haptics } from "../lib/haptics";
import { BreathingOrbit } from "./BreathingOrbit";

/**
 * Count-UP step timer inside the tick-gauge orbit — never a punitive
 * countdown. Soft haptic once when the estimate passes; keeps counting
 * calmly after. The pace label lives inside the dial, PepKit-style.
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

  const past = seconds >= estimatedSeconds;

  return (
    <View className="items-center">
      <BreathingOrbit
        seconds={seconds}
        past={past}
        progress={estimatedSeconds > 0 ? seconds / estimatedSeconds : 0}
        label={
          past
            ? "no rush — still counts"
            : `aiming for ~${Math.max(1, Math.round(estimatedSeconds / 60))} min`
        }
      />
    </View>
  );
}
