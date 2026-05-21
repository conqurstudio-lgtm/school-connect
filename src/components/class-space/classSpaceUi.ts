// Shared Class Space UI tokens
// Keep Parent and Teacher screens visually aligned.
// This file is intentionally simple so we can migrate existing inline styles gradually.

export const CLASS_SPACE_UI = {
  shellMaxWidth: 520,

  tabBar: {
    height: 38,
    padding: 3,
    radius: 999,
    fontSize: 13.2,
    selectedWeight: 850,
    defaultWeight: 750,
  },

  button: {
    minHeight: 44,
    primaryHeight: 46,
    radius: 999,
    fontSize: 14,
    fontWeight: 850,
  },

  input: {
    minHeight: 46,
    radius: 14,
    fontSize: 16,
    padding: '12px 14px',
  },

  card: {
    radius: 18,
    softRadius: 22,
    padding: 14,
  },

  listRow: {
    minHeight: 58,
    padding: '13px 2px',
  },
} as const
