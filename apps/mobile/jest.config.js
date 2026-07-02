/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Worklets ships a resolver that maps its .native modules to the JS
  // implementation under jest.
  resolver: "react-native-worklets/jest/resolver.js",
  setupFilesAfterEnv: ["./test/setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop|zustand|@better-auth|better-auth|@better-fetch|ai|@ai-sdk/.*)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/.expo/"],
};
