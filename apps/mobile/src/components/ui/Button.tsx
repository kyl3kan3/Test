import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { haptics } from "../../lib/haptics";
import { springs } from "../../lib/motion";

type Variant = "primary" | "success" | "surface" | "ghost" | "danger";

const CONTAINER: Record<Variant, string> = {
  primary: "",
  success: "",
  surface: "bg-raised border border-line active:bg-surface",
  ghost: "bg-transparent",
  danger: "bg-transparent border border-danger/40",
};

const LABEL: Record<Variant, string> = {
  primary: "text-on-primary",
  success: "text-on-primary",
  surface: "text-ink",
  ghost: "text-ink-dim",
  danger: "text-danger",
};

const GRADIENTS: Record<string, readonly [string, string, string]> = {
  primary: ["#EC9079", "#E07A5F", "#D0684E"],
  success: ["#98BFA3", "#7FA88A", "#6B9276"],
};
// Soft warm drop shadow (not a colored neon glow) suits the light ground.
const SHADOW: Record<string, string> = {
  primary: "#C8624A",
  success: "#6B9276",
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function Button({
  label,
  onPress,
  variant = "primary",
  big = false,
  disabled = false,
  loading = false,
  pulse = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  big?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Slow attention-drawing glow, for the one primary CTA per screen. */
  pulse?: boolean;
  testID?: string;
}) {
  const gradient = GRADIENTS[variant];
  const pressScale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (pulse && !disabled) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [pulse, disabled, glow]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  // Shadow-only pulse — deliberately no transform/scale here. A perpetually
  // animating transform never settles, which makes Playwright (and some
  // real-device accessibility tooling) treat the button as permanently
  // "unstable" and unclickable.
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.22 + glow.value * 0.22,
    shadowRadius: 14 + glow.value * 12,
  }));

  const onPressIn = () => {
    pressScale.value = withSpring(0.96, springs.snappy);
  };
  const onPressOut = () => {
    pressScale.value = withSpring(1, springs.snappy);
  };

  const content = loading ? (
    <ActivityIndicator color={gradient ? "#FFF7F0" : "#3A2E27"} />
  ) : (
    <Text className={`font-body-semibold ${big ? "text-lg" : "text-base"} ${LABEL[variant]}`}>
      {label}
    </Text>
  );

  const pressable = (extraClassName: string) => (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      className={`items-center justify-center rounded-2xl ${big ? "py-5" : "py-4"} px-6 ${extraClassName}`}
    >
      {content}
    </Pressable>
  );

  if (!gradient) {
    return (
      <Animated.View style={pressStyle}>
        {pressable(`${CONTAINER[variant]} ${disabled ? "opacity-40" : ""}`)}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      className={disabled ? "opacity-40" : ""}
      style={[
        {
          borderRadius: 16,
          shadowColor: SHADOW[variant] ?? gradient[1],
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        },
        glowStyle,
      ]}
    >
      <AnimatedLinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[{ borderRadius: 16 }, pressStyle]}
      >
        {pressable("")}
      </AnimatedLinearGradient>
    </Animated.View>
  );
}
