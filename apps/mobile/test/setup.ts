// Unit tests run against the purchases stub, never the RC native module.
process.env.EXPO_PUBLIC_E2E = "1";

// Reanimated (and its worklets runtime) need their official jest mock.
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// Quiet noisy native-module warnings in the jest (node) environment.
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
