'use client'

import type { CSSProperties } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  label?: string
  style?: CSSProperties
}

export default function SCTextArea({ value, onChange, placeholder, rows = 4, label, style }: Props) {
  return (
    <label style={{ display: 'block', ...style }}>
      {label ? (
        <span
          style={{
            display: 'block',
            margin: '0 0 7px',
            fontSize: 11,
            fontWeight: 650,
            color: 'var(--sc-ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          {label}
        </span>
      ) : null}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="sc-textarea"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 13px',
          borderRadius: 16,
          border: '1px solid #D8DDE1',
          background: 'var(--sc-white)',
          color: 'var(--sc-ink)',
          fontSize: 16,
          lineHeight: 1.5,
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
        }}
      />
    </label>
  )
}
