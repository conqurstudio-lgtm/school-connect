// Shared Class Space UI tokens
// Parent and Teacher should use these same values so the app feels like one product.

export const CLASS_SPACE_UI = {
  color: {
    bg: '#FCFCFF',
    white: '#FFFFFF',
    ink: '#1A1A1A',
    ink3: '#9A9A9A',
    border: 'rgba(0,0,0,0.07)',
    soft: '#F4F4F6',
    red: '#EF4444',
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
} as const

export type ClassSpaceTabItem = {
  key: string
  label: string
  badge?: number
}
