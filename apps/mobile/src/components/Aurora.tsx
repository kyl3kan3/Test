import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Ambient aurora layer — two drifting radial glows on a slow loop.
 * The one place the home screen spends its motion budget.
 */
function Blob({
  size,
  color,
  opacity,
  x,
  y,
  duration,
  delayFactor = 0,
}: {
  size: number;
  color: string;
  opacity: number;
  x: number;
  y: number;
  duration: number;
  delayFactor?: number;
}) {
  const t = useSharedValue(delayFactor);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x + t.value * 26 },
      { translateY: y + t.value * 18 },
      { scale: 1 + t.value * 0.14 },
    ],
    opacity: opacity * (0.75 + t.value * 0.25),
  }));

  return (
    <Animated.View style={[{ position: "absolute", width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}

export function Aurora() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Blob size={420} color="#E85F3F" opacity={0.4} x={-90} y={-140} duration={18000} />
      <Blob
        size={300}
        color="#FFC24B"
        opacity={0.13}
        x={190}
        y={-60}
        duration={22000}
        delayFactor={0.5}
      />
      <Blob
        size={320}
        color="#7DD3FC"
        opacity={0.1}
        x={60}
        y={420}
        duration={26000}
        delayFactor={0.3}
      />
    </View>
  );
}
