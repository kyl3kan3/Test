import { ActivityIndicator, Pressable, Text } from "react-native";
import { haptics } from "../../lib/haptics";

type Variant = "primary" | "surface" | "ghost" | "danger";

const CONTAINER: Record<Variant, string> = {
  primary: "bg-primary active:bg-primary-pressed",
  surface: "bg-raised border border-line active:bg-surface",
  ghost: "bg-transparent",
  danger: "bg-transparent border border-danger/40",
};

const LABEL: Record<Variant, string> = {
  primary: "text-on-primary",
  surface: "text-ink",
  ghost: "text-ink-dim",
  danger: "text-danger",
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
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      className={`items-center justify-center rounded-2xl ${big ? "py-5" : "py-4"} px-6 ${CONTAINER[variant]} ${disabled ? "opacity-40" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color="#0D0D14" />
      ) : (
        <Text
          className={`font-body-semibold ${big ? "text-lg" : "text-base"} ${LABEL[variant]}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
