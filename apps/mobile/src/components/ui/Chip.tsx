import { Pressable, Text } from "react-native";
import { haptics } from "../../lib/haptics";

export function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      className={`rounded-2xl border px-5 py-4 mb-3 ${
        selected ? "border-primary bg-primary/15" : "border-line bg-surface"
      }`}
    >
      <Text
        className={`font-body-medium text-base ${selected ? "text-primary" : "text-ink"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
