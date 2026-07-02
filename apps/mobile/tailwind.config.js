const { colors } = require("../../packages/shared/src/theme-tokens.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: colors.bg,
        surface: colors.surface,
        raised: colors.surfaceRaised,
        line: colors.border,
        primary: colors.primary,
        "primary-pressed": colors.primaryPressed,
        hype: colors.hype,
        success: colors.success,
        freeze: colors.freeze,
        danger: colors.danger,
        ink: colors.text,
        "ink-dim": colors.textDim,
        "on-primary": colors.textOnPrimary,
      },
      fontFamily: {
        body: ["Lexend_400Regular"],
        "body-medium": ["Lexend_500Medium"],
        "body-semibold": ["Lexend_600SemiBold"],
        display: ["Unbounded_700Bold"],
        "display-medium": ["Unbounded_500Medium"],
      },
    },
  },
  plugins: [],
};
