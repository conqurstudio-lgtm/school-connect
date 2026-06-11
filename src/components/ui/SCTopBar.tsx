'use client'

import type { ReactNode } from 'react'

type Props = {
  title?: string
  left?: ReactNode
  right?: ReactNode
  compact?: boolean
}

export default function SCTopBar({ title, left, right, compact = false }: Props) {
  return (
    <header
      className="sc-top-bar"
      style={{
        height: compact ? 52 : 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 18px',
        background: 'var(--sc-bg)',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        {left}
      </div>
      {title ? (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 620,
            color: 'var(--sc-ink)',
            letterSpacing: '-.01em',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {right}
      </div>
    </header>
  )
}
