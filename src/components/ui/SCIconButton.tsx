'use client'

import type { CSSProperties, ReactNode } from 'react'

export type SCIconButtonProps = {
  children: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  size?: number
  tone?: 'default' | 'quiet' | 'danger'
  style?: CSSProperties
}

export default function SCIconButton({
  children,
  label,
  onClick,
  disabled = false,
  size = 38,
  tone = 'default',
  style,
}: SCIconButtonProps) {
  const bg = tone === 'quiet' ? 'transparent' : 'var(--sc-soft)'
  const color = tone === 'danger' ? 'var(--sc-danger)' : 'var(--sc-ink)'

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="sc-icon-button"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: 'none',
        background: bg,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
