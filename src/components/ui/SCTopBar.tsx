'use client'

import React from 'react'

type SCTopBarProps = {
  title?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
  center?: boolean
}

export default function SCTopBar({ title, left, right, center = false }: SCTopBarProps) {
  return (
    <header
      className="sc-top-bar"
      style={{
        minHeight: 48,
        display: 'grid',
        gridTemplateColumns: '44px 1fr 44px',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>{left}</div>
      <div
        style={{
          minWidth: 0,
          textAlign: center ? 'center' : 'left',
          fontSize: 16,
          fontWeight: 620,
          letterSpacing: '-0.02em',
          color: 'var(--sc-ink)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{right}</div>
    </header>
  )
}
