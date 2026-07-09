import { useEffect, useMemo } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const COLORS = ["#FFD9A0", "#FFF6F0", "#FFB27A", "#1D1210", "#FFE9C4"];
const COUNT = 42;

function Particle({ index }: { index: number }) {
  const { width, height } = Dimensions.get("window");
  const progress = useSharedValue(0);

  // Deterministic pseudo-random spread per index (stable across renders).
  const seed = useMemo(() => {
    const r = (n: number) => {
      const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return {
      x0: r(1) * width,
      drift: (r(2) - 0.5) * 160,
      delay: r(3) * 400,
      duration: 1400 + r(4) * 1200,
      size: 6 + r(5) * 8,
      color: COLORS[index % COLORS.length],
      spin: (r(6) - 0.5) * 720,
    };
  }, [index, width]);

  useEffect(() => {
    progress.value = withDelay(
      seed.delay,
      withTiming(1, { duration: seed.duration, easing: Easing.out(Easing.quad) }),
    );
  }, [progress, seed]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: seed.x0 + progress.value * seed.drift },
      { translateY: -30 + progress.value * (height * 0.9) },
      { rotate: `${progress.value * seed.spin}deg` },
    ],
    opacity: 1 - progress.value * 0.9,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-sm"
      style={[{ width: seed.size, height: seed.size, backgroundColor: seed.color }, style]}
    />
  );
}

export function Confetti() {
  return (
    <View pointerEvents="none" className="absolute inset-0" testID="confetti">
      {Array.from({ length: COUNT }, (_, i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}
