export const Spacing = {
  // Base spacing units
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Component-specific spacing
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },

  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },

  screen: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Layout spacing
  layout: {
    header: 16,
    section: 24,
    container: 20,
  },
} as const;

export type SpacingType = typeof Spacing;
