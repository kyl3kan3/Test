import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { haptics } from "../../lib/haptics";

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
  primary: ["#8DF5BE", "#3BE38B", "#16A05F"],
  success: ["#7FF2C0", "#4ADE9E", "#2FB57F"],
};

export function Button({
  label,
  onPress,
  variant = "primary",
  big = false,
  disabled = false,
  loading = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  big?: boolean;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const gradient = GRADIENTS[variant];

  const inner = (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      className={`items-center justify-center rounded-2xl ${big ? "py-5" : "py-4"} px-6 ${CONTAINER[variant]} ${disabled && !gradient ? "opacity-40" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={gradient ? "#070B09" : "#F1F7F2"} />
      ) : (
        <Text
          className={`font-body-semibold ${big ? "text-lg" : "text-base"} ${LABEL[variant]}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );

  if (!gradient) return inner;

  return (
    <View
      className={disabled ? "opacity-40" : ""}
      style={{
        borderRadius: 16,
        shadowColor: gradient[1],
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16 }}
      >
        {inner}
      </LinearGradient>
    </View>
  );
}
