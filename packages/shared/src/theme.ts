/**
 * "Calm arcade" design tokens — dark, low-stimulation base with high-dopamine
 * accents reserved for wins. Dark-only at v1.
 * All text/surface pairs hold >= 4.5:1 contrast:
 *   text (#F4F4F8) on bg (#0D0D14)      ~17.8:1
 *   text on surface (#171723)            ~15.2:1
 *   textDim (#9A9AB0) on bg              ~6.6:1
 *   bg text (#0D0D14) on primary (#8B7CFF) ~6.9:1
 */
export const colors = {
  bg: "#0D0D14",
  surface: "#171723",
  surfaceRaised: "#1F1F2E",
  border: "#2A2A3D",
  primary: "#8B7CFF",
  primaryPressed: "#6F5FE6",
  hype: "#FF7A59",
  success: "#4ADE9E",
  freeze: "#7DD3FC",
  danger: "#FB7185",
  text: "#F4F4F8",
  textDim: "#9A9AB0",
  textOnPrimary: "#0D0D14",
} as const;

export const fonts = {
  body: "Lexend_400Regular",
  bodyMedium: "Lexend_500Medium",
  bodySemiBold: "Lexend_600SemiBold",
  display: "Unbounded_700Bold",
  displayMedium: "Unbounded_500Medium",
} as const;

export const typeScale = {
  display: 40,
  displaySmall: 34,
  title: 24,
  subtitle: 20,
  body: 17,
  caption: 13,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
