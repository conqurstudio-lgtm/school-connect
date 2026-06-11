'use client'

import React from 'react'

type SCSectionProps = {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  flush?: boolean
}

export default function SCSection({ title, subtitle, right, children, flush = false }: SCSectionProps) {
  return (
    <section className="sc-section" style={{ marginTop: 18 }}>
      {(title || subtitle || right) ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 10, padding: flush ? '0 0' : '0 2px' }}>
          <div style={{ minWidth: 0 }}>
            {title ? <h2 style={{ margin: 0, fontSize: 15, fontWeight: 620, letterSpacing: '-0.015em', color: 'var(--sc-ink)' }}>{title}</h2> : null}
            {subtitle ? <p style={{ margin: '3px 0 0', fontSize: 12.4, lineHeight: 1.32, color: 'var(--sc-ink-3)' }}>{subtitle}</p> : null}
          </div>
          {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
        </div>
      ) : null}
      <div>{children}</div>
    </section>
  )
}
