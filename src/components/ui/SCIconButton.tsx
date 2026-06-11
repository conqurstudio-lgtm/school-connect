'use client'

import React from 'react'

type SCIconButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  label: string
  size?: number
  subtle?: boolean
  disabled?: boolean
}

export default function SCIconButton({ children, onClick, label, size = 38, subtle = true, disabled = false }: SCIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="sc-icon-button"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: 'none',
        background: subtle ? 'var(--sc-soft)' : 'var(--sc-ink)',
        color: subtle ? 'var(--sc-ink)' : '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  )
}
