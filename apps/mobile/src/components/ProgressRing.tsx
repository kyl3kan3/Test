import { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "@dtt/shared/theme";
import { durations } from "../lib/motion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Small completion ring for resumable task cards. */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const size = 38;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(pct, { duration: durations.medium * 2 });
  }, [pct, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${c * animated.value} ${c}`,
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceRaised}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.success}
          strokeWidth={stroke}
          fill="none"
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text className="font-body-semibold text-[9px] text-ink-dim">
        {Math.round(pct * 100)}%
      </Text>
    </View>
  );
}
