'use client'

import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger'
  fullWidth?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  style?: CSSProperties
}

export default function SCButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  tone = 'primary',
  fullWidth = false,
  leading,
  trailing,
  style,
}: Props) {
  const isPrimary = tone === 'primary'
  const isQuiet = tone === 'quiet'
  const isDanger = tone === 'danger'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="sc-button"
      style={{
        width: fullWidth ? '100%' : 'auto',
        minHeight: 44,
        borderRadius: 999,
        border: isPrimary || isQuiet ? 'none' : '1px solid var(--sc-border)',
        background: isPrimary ? 'var(--sc-ink)' : isQuiet ? 'transparent' : 'var(--sc-white)',
        color: isDanger ? 'var(--sc-danger)' : isPrimary ? 'var(--sc-white)' : 'var(--sc-ink)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: isQuiet ? '0 8px' : '0 16px',
        fontSize: 13,
        fontWeight: 580,
        letterSpacing: '-.005em',
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {leading ? <span style={{ display: 'inline-flex', alignItems: 'center' }}>{leading}</span> : null}
      <span>{children}</span>
      {trailing ? <span style={{ display: 'inline-flex', alignItems: 'center' }}>{trailing}</span> : null}
    </button>
  )
}
