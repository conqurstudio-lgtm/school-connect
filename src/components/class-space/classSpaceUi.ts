// Shared Class Space UI tokens
// Parent and Teacher should use these same values so the app feels like one product.

export const CLASS_SPACE_UI = {
  shell: {
    maxWidth: 520,
    background: '#FCFCFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  color: {
    bg: '#FCFCFF',
    white: '#FFFFFF',
    ink: '#1A1A1A',
    ink2: '#4A4A4A',
    ink3: '#9A9A9A',
    border: 'rgba(0,0,0,0.07)',
    soft: '#F4F4F6',
    softBlue: '#F0F4FF',
    blue: '#4F7DF7',
    red: '#EF4444',
  },

  topProfile: {
    padding: 'calc(4px + env(safe-area-inset-top, 0px)) 14px 5px',
    avatar: 42,
    avatarRadius: 15,
    titleSize: 15,
    subtitleSize: 12.2,
    actionSize: 34,
  },

  tabs: {
    outerPadding: '6px 14px 8px',
    groupPadding: 3,
    height: 38,
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
    padding: '12px 16px',
  },

  iconButton: {
    small: 34,
    medium: 38,
    large: 42,
    radius: 999,
  },

  input: {
    minHeight: 46,
    radius: 14,
    fontSize: 16,
    padding: '12px 14px',
    lineHeight: 1.45,
  },

  card: {
    radius: 18,
    softRadius: 22,
    padding: 14,
    softShadow: '0 10px 26px rgba(0,0,0,0.045)',
  },

  listRow: {
    minHeight: 58,
    padding: '13px 2px',
    avatar: 38,
  },

  message: {
    bodyFontSize: 14,
    bodyLineHeight: 1.5,
    metaFontSize: 10.5,
  },
} as const

export type ClassSpaceTabItem = {
  key: string
  label: string
  badge?: number
}
