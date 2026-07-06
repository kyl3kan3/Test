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
        body: ["Nunito_400Regular"],
        "body-medium": ["Nunito_600SemiBold"],
        "body-semibold": ["Nunito_700Bold"],
        display: ["Fraunces_600SemiBold"],
        "display-medium": ["Fraunces_500Medium"],
      },
    },
  },
  plugins: [],
};
