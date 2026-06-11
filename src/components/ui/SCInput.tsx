'use client'

import type { ChangeEvent, CSSProperties } from 'react'

type Props = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  autoFocus?: boolean
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  style?: CSSProperties
}

export default function SCInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  autoFocus = false,
  inputMode,
  style,
}: Props) {
  return (
    <label style={{ display: 'block', ...style }}>
      {label ? (
        <span style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 620,
          color: 'var(--sc-ink-3)',
          textTransform: 'uppercase',
          letterSpacing: '.055em',
          marginBottom: 7,
        }}>
          {label}
        </span>
      ) : null}

      <input
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode={inputMode}
        style={{
          width: '100%',
          minHeight: 48,
          boxSizing: 'border-box',
          borderRadius: 16,
          border: '1px solid var(--sc-border-soft)',
          background: 'var(--sc-surface)',
          color: 'var(--sc-ink)',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: 16,
          fontWeight: 450,
          padding: '0 14px',
          transition: 'border-color .16s var(--sc-ease-standard), background .16s var(--sc-ease-standard), box-shadow .16s var(--sc-ease-standard)',
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={(event) => {
          event.currentTarget.style.borderColor = 'rgba(17,17,17,.16)'
          event.currentTarget.style.boxShadow = '0 0 0 4px rgba(17,17,17,.035)'
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = 'var(--sc-border-soft)'
          event.currentTarget.style.boxShadow = 'none'
        }}
      />
    </label>
  )
}
