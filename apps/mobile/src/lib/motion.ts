/** Centralized spring/timing configs so motion feels consistent app-wide. */
export const springs = {
  /** Snappy UI feedback — button presses, chips. */
  snappy: { damping: 18, stiffness: 240, mass: 0.6 },
  /** Softer entrance for cards and screens. */
  gentle: { damping: 22, stiffness: 140, mass: 0.9 },
  /** Bouncy celebration pops. */
  pop: { damping: 10, stiffness: 200, mass: 0.7 },
} as const;

export const durations = {
  breath: 6000, // session background breathing loop
  quick: 180,
  medium: 320,
} as const;
