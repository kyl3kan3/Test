import { ReactNode } from "react";
import { ScrollView, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const base: ViewStyle = {
    flex: 1,
    paddingTop: insets.top + 8,
    paddingBottom: insets.bottom + 8,
  };
  if (scroll) {
    return (
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerClassName={padded ? "px-5 pb-10" : "pb-10"}
        style={[base, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View className={`flex-1 bg-bg ${padded ? "px-5" : ""}`} style={[base, style]}>
      {children}
    </View>
  );
}
